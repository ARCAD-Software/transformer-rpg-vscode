import { BrowserItem, CommandResult, IBMiMember, MemberItem, ObjectItem } from "@halcyontech/vscode-ibmi-types";
import vscode, { CancellationToken, commands, l10n, ProgressLocation, window } from "vscode";
import { CommandParams, ConfigManager } from "../configuration";
import { refreshListExplorer, tfrrpgOutput } from "../extension";
import { generateCommand } from "../rpgcommands/commandUtils";
import { MESSAGES } from "../utils/constants";
import { findObjectType, listConvertibleMembers, listObjects } from "./api";
import { executeConversionCommand, handleConversion } from "./conversion";
import { ConversionStatus } from "./conversionMessage";
import { ConversionTarget } from "./model";
import { ConversionList } from "./views/conversionListBrowser";
import { commandReportUI, createTabs, setupTabWindow } from "./webviews/panel";

interface ConversionConfiguration {
    conversionTarget: ConversionTarget
    parentnode?: BrowserItem
}

export interface ExecutionReport {
    target: ConversionTarget
    result: CommandResult
}

const openPanels = new Map<string, { dispose: () => void }>();

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
                await convertMembers(commandParameters, param.conversionTarget);
            } else {
                if (page.data.buttons === 'convertnsave') {
                    ConfigManager.setParams(commandParameters);
                }
                handleConversion(commandParameters, param.conversionTarget, param.parentnode);
            }
        }
    }
}

async function convertMembers(data: CommandParams, conversionTarget: ConversionTarget): Promise<void> {
    const sourceMembersList = await getMembersListWithProgress(conversionTarget);
    if (sourceMembersList.length) {
        const memberNames = sourceMembersList
            .slice(0, 10)
            .map(member => member.name)
            .join(', ');

        const displayedNames = sourceMembersList.length > 10
            ? `${memberNames},...`
            : memberNames;

        const isConfirmtoConvert = await window.showWarningMessage(
            l10n.t(`Confirm to convert {0} members?\n{1}`, sourceMembersList.length, displayedNames),
            { modal: true },
            l10n.t("Yes"),
            l10n.t("No")
        );
        if (isConfirmtoConvert) {
            await window.withProgress({
                location: ProgressLocation.Notification,
                title: l10n.t("TFRRPG"),
                cancellable: true
            }, async (progress, token) => {
                await lookupMemberObjectTypes(sourceMembersList, conversionTarget.library, progress, token);
                await convertMembersWithProgress(data, sourceMembersList, progress, token);
            });
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

export async function convertMembersWithProgress(
    commandParam: CommandParams,
    conversions: ConversionTarget[],
    progress: { report: (value: { increment: number; message: string }) => void },
    token: CancellationToken,
    name?: string
): Promise<ExecutionReport[]> {
    const totalMembers = conversions.length;
    const executionResult: ExecutionReport[] = [];
    const increment = 100 / conversions.length;
    let current = 1;
    for (const conversion of conversions) {
        if (token.isCancellationRequested) {
            window.showInformationMessage(l10n.t("Conversion cancelled"));
            break;
        }

        await convertMember(commandParam, conversion, executionResult);
        progress.report({
            increment,
            message: l10n.t("Performed Conversion for {0} of {1} members", current++, totalMembers),
        });
    }
    if (executionResult.length === totalMembers) {
        const message = totalMembers === 1
            ? l10n.t("Member converted successfully!")
            : l10n.t("All members converted successfully!");

        window
            .showInformationMessage(
                message,
                l10n.t("Show Conversion Report")
            )
            .then((selection) => {
                if (selection === l10n.t("Show Conversion Report")) {
                    showConversionReport(executionResult, name ?? "");
                }
            });
    }
    return executionResult;
}


async function convertMember(
    data: CommandParams,
    member: ConversionTarget,
    executionResult: ExecutionReport[]
): Promise<void> {
    const cmd = await generateCommand(data, member);
    const result = await executeConversionCommand(cmd);
    if (result) {
        executionResult.push({ target: member, result });
    }
}

async function showConversionReport(report: ExecutionReport[], itemName: string): Promise<void> {
    const title = l10n.t("Conversion Report-{0}", itemName);

    if (openPanels.has(title)) {
        openPanels.get(title)?.dispose();
        openPanels.delete(title);
    }

    const resultWindow = commandReportUI(report);
    const page = await resultWindow.loadPage(title);

    if (page) {
        openPanels.set(title, page.panel);
    }

}

async function lookupMemberObjectTypes(targets: ConversionTarget[], library: string, progress: { report: (value: { increment: number, message: string }) => void }, token: CancellationToken) {
    const cache = await listObjects(library);
    const increment = 100 / targets.length;
    for (const target of targets) {
        if (token.isCancellationRequested) {
            window.showInformationMessage(l10n.t("Process cancelled"));
            break;
        }

        if (target.member) {
            progress.report({ increment, message: l10n.t("Updating object type for {0}", target.member) });
            target.objectType = await findObjectType(library, target.member, cache);
        }
    }
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
