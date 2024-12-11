import { BrowserItem, CommandResult, IBMiMember, MemberItem, ObjectItem } from "@halcyontech/vscode-ibmi-types";
import vscode, { commands, l10n, ProgressLocation, window } from "vscode";
import { Code4i } from "../code4i";
import { ConfigManager } from "../configuration";
import { refreshListExplorer, tfrrpgOutput } from "../extension";
import { generateCommand } from "../rpgcommands/commandUtils";
import { MESSAGES } from "../utils/constants";
import { findObjectType, listConvertibleMembers } from "./api";
import { handleConversion as convertSingleMember, executeConversionCommand } from "./conversion";
import { ConversionStatus } from "./conversionMessage";
import { CommandParams, ConversionTarget } from "./model";
import { ConversionList } from "./views/conversionListBrowser";
import { createTabs, setupTabWindow, showConversionReport } from "./webviews/panel";

interface ConversionConfiguration {
    conversionTarget: ConversionTarget
    parentnode?: BrowserItem
}

export interface ExecutionReport {
    target: ConversionTarget
    result: CommandResult
}

export async function openConfigWindow(param: ConversionConfiguration): Promise<void> {
    const config = ConfigManager.getParams();
    if (config) {
        const multiple = !param.conversionTarget.member;
        const tabs = createTabs(param.conversionTarget, config);
        const tabwindow = setupTabWindow(tabs, multiple);

        const page = await tabwindow.loadPage<CommandParams>(l10n.t("ARCAD-Transformer RPG: {0}", param.conversionTarget.member || param.conversionTarget.file));
        if (page?.data) {
            const commandParameters = page.data;
            page.panel.dispose();
            if (multiple) {
                await convertMultipleMembers(commandParameters, param.conversionTarget);
            } else {
                if (page.data.buttons === 'convertnsave') {
                    ConfigManager.setParams(commandParameters);
                }
                convertSingleMember(commandParameters, param.conversionTarget, param.parentnode);
            }
        }
    }
}

async function convertMultipleMembers(data: CommandParams, conversionTarget: ConversionTarget): Promise<void> {
    const sourceMembersList: ConversionTarget[] = (await getMembersListWithProgress(conversionTarget))
        .map(member => ({ library: member.library, file: member.file, member: member.name, extension: member.extension }));
    if (sourceMembersList.length) {
        const memberNames = sourceMembersList
            .slice(0, 10)
            .map(member => `- ${member.member}`)
            .join('\n');

        const detail = `${memberNames}${sourceMembersList.length > 10 ? l10n.t(`\n- ${sourceMembersList.length - 10} more...`) : ''}`;
        const isConfirmtoConvert = await window.showWarningMessage(
            l10n.t(`Do you confirm the conversion of {0} members?`, sourceMembersList.length),
            { modal: true, detail },
            l10n.t("Yes"),
        );
        if (isConfirmtoConvert) {
            await lookupMemberObjectTypes(sourceMembersList, conversionTarget.library);
            await convertTargets(data, sourceMembersList, conversionTarget.library);
        }
    }
    else {
        window.showInformationMessage(l10n.t("No members found to convert"));
        return;
    }
}

async function getMembersListWithProgress(target: ConversionTarget): Promise<IBMiMember[]> {
    return window.withProgress({
        location: ProgressLocation.Notification,
        title: MESSAGES.FETCHING_MEMBERS,
        cancellable: false
    }, async () => {
        try {
            return listConvertibleMembers(target);
        } catch (error) {
            tfrrpgOutput().appendLine(l10n.t("Failed to fetch members list: {0}", JSON.stringify(error)));
            window.showErrorMessage(MESSAGES.FETCH_FAILED, l10n.t("Open output"))
                .then(open => {
                    if (open) {
                        tfrrpgOutput().show();
                    }
                });
            return [];
        }
    });
}

export async function convertTargets(
    commandParam: CommandParams,
    conversions: ConversionTarget[],
    name: string
): Promise<ExecutionReport[]> {
    return await window.withProgress({
        location: ProgressLocation.Notification,
        title: l10n.t("Converting members"),
        cancellable: true
    }, async (progress, token) => {
        const totalMembers = conversions.length;
        const executionResult: ExecutionReport[] = [];
        const increment = 100 / conversions.length;
        let current = 1;
        let converted = 0;
        for (const conversion of conversions) {
            if (token.isCancellationRequested) {
                window.showInformationMessage(l10n.t("Conversion cancelled"));
                break;
            }

            if (await convertMember(commandParam, conversion, executionResult)) {
                converted++;
            }
            progress.report({
                increment,
                message: l10n.t("{0}/{1}", current++, totalMembers),
            });
        }

        const allConverted = (converted === totalMembers);
        const openReport = (open?: string) => { if (open) { showConversionReport(executionResult, name || ""); } };
        if (allConverted) {
            window.showInformationMessage(totalMembers === 1
                ? l10n.t("Member converted successfully!")
                : l10n.t("All members converted successfully!"),
                l10n.t("Show Conversion Report")
            ).then(openReport);
        }
        else {
            window.showErrorMessage(
                totalMembers === 1
                    ? l10n.t("Member conversion failed!")
                    : l10n.t("{0}/{1} members could not be converted!", totalMembers - converted, totalMembers),
                l10n.t("Show Conversion Report")
            ).then(openReport);
        }

        return executionResult;
    });
}

async function convertMember(
    data: CommandParams,
    member: ConversionTarget,
    executionResult: ExecutionReport[]
) {
    const cmd = await generateCommand(data, member);
    const result = await executeConversionCommand(cmd);
    if (result) {
        executionResult.push({ target: member, result });
    }

    return result && (result.code === 0 || Code4i.getTools().parseMessages(result.stderr || result.stdout).findId("MSG4178"));
}

async function lookupMemberObjectTypes(targets: ConversionTarget[], library: string) {
    await window.withProgress({
        location: ProgressLocation.Notification,
        title: l10n.t("Looking up members' object types"),
        cancellable: true
    }, async (progress, token) => {
        const cache = new Map;
        const increment = 100 / targets.length;
        let current = 1;
        for (const target of targets) {
            if (token.isCancellationRequested) {
                return;
            }

            if (target.member) {
                target.objectType = await findObjectType(library, target.member, cache);
                progress.report({ increment, message: `${current++}/${targets.length}` });
            }
        }
    });
}

export async function addMembersToConversionList(node: MemberItem | ObjectItem): Promise<void> {
    try {
        const conversionList = await ConfigManager.getConversionList();

        if (!conversionList.length) {
            const selection = await window.showInformationMessage(
                l10n.t("No conversion list found. Create a conversion list first."),
                l10n.t("Create new Conversion List"),
                l10n.t("Cancel")
            );
            if (selection === l10n.t("Create new Conversion List")) {
                await commands.executeCommand('tfrrpg-list-create');
            }
            return;
        }

        // Prompt the user to select a conversion list
        const selectedListName = await window.showQuickPick(
            conversionList.map(list => list.listname),
            { title: l10n.t("Select Conversion List") }
        );

        if (!selectedListName) {
            window.showInformationMessage(l10n.t("No conversion list selected."));
            return;
        }

        const selectedList = conversionList.find(list => list.listname === selectedListName);
        if (!selectedList) {
            window.showErrorMessage(l10n.t("Selected conversion list not found."));
            return;
        }

        const membersToAdd: IBMiMember[] = [];
        if ("member" in node) {
            membersToAdd.push(node.member);
        } else {
            const selectedMembers = await getSelectedMembers(node);
            if (selectedMembers) {
                membersToAdd.push(...selectedMembers);
            }
        }
        const existingMembers = new Set(selectedList.items.map(item => item.member));
        const newMembers = membersToAdd.filter(m => !existingMembers.has(m.name));

        if (newMembers.length === 0) {
            return;
        }

        const existingMemberNames = membersToAdd
            .filter(m => existingMembers.has(m.name))
            .map(m => m.name)
            .join(', ');

        if (existingMemberNames) {
            window.showInformationMessage(
                l10n.t("The following members already exist in the conversion list: {0}", existingMemberNames)
            );
        }

        addMembersToList(selectedList, newMembers);
        await ConfigManager.updateConversionList(selectedList);

        window.showInformationMessage(
            l10n.t("{0} added to the conversion list.", newMembers.length > 1 ? l10n.t("Members") : l10n.t("Member"))
        );

        refreshListExplorer();


    } catch (error) {
        window.showErrorMessage(l10n.t("An error occurred while adding members to the conversion list."));
        console.error(error);
    }
}

function addMembersToList(list: ConversionList, members: IBMiMember[]): void {
    members.forEach(memberItem => {
        list.items.push({
            conversiondate: "",
            library: memberItem.library,
            member: memberItem.name,
            message: "",
            objtype: "",
            srctype: memberItem.extension!,
            status: ConversionStatus.NA,
            targetmember: memberItem.file
        });
    });
}
async function getSelectedMembers(node: ObjectItem): Promise<IBMiMember[] | undefined> {
    const memberQuickPick = window.createQuickPick();
    memberQuickPick.title = l10n.t("Select Members to Add");
    memberQuickPick.busy = true;
    memberQuickPick.canSelectMany = true;
    memberQuickPick.ignoreFocusOut = true;

    try {
        const members = await getMembersListWithProgress({
            library: node.object.library, file: node.object.name,
            filter: { type: node.filter.filterType, members: node.filter.member, extensions: node.filter.memberType }
        });
        memberQuickPick.items = members.map(member => ({ label: member.name, description: member.text }));
        memberQuickPick.busy = false;
        memberQuickPick.show();

        return await new Promise<IBMiMember[] | undefined>((resolve) => {
            memberQuickPick.onDidAccept(() => {
                const selectedMembers = memberQuickPick.selectedItems
                    .map(item => members.find(m => m.name === item.label))
                    .filter(m => m !== undefined) as IBMiMember[];
                resolve(selectedMembers);
                memberQuickPick.dispose();
            });

            memberQuickPick.onDidHide(() => {
                resolve(undefined);
                memberQuickPick.dispose();
            });
        });

    } catch (error) {
        tfrrpgOutput().appendLine(l10n.t("Error selecting members: {0}", JSON.stringify(error)));
        vscode.window.showErrorMessage(l10n.t("Error selecting members"), l10n.t("Open output"))
            .then(open => {
                if (open) {
                    tfrrpgOutput().show();
                }
            });
        memberQuickPick.dispose();
        return undefined;
    }
}
