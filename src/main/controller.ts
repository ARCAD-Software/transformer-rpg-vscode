import { CommandResult, IBMiMember, MemberItem } from "@halcyontech/vscode-ibmi-types";
import { CommandParams, ConfigManager } from "../configuration";
import { l10n, window, ProgressLocation, CancellationToken, commands } from "vscode";
import { commandReportUI, createTabs, setupTabWindow } from "./webviews/panel";
import { executeConversionCommand, handleConversion } from "./conversion";
import { generateCommand } from "../rpgcommands/commandUtils";
import { Code4i } from "../code4i";
import { refreshIbmIExplorer, refreshListExplorer } from "../extension";
import { IMemberItem } from "./model";
import { ConversionList } from "./views/conversionListBrowser";

interface WindowConfig {
    member: IBMiMember;
    massconvt: boolean;
    parentnode?: MemberItem;
    getMembers?: () => Promise<IBMiMember[]>;
}

export interface ExecutionReport {
    sourceMember: IBMiMember;
    result: CommandResult;
}

export async function openConfigWindow(param: WindowConfig): Promise<void> {
    const config = ConfigManager.getParams();
    if (!config) { return; };

    const tabs = createTabs(param.member, config, param.massconvt);
    const tabwindow = setupTabWindow(tabs);

    const page = await tabwindow.loadPage<any>(l10n.t("ARCAD-Transformer RPG: {0}", param.member.name));
    if (page && page.data) {
        const commandParameters = page.data as CommandParams;
        page.panel.dispose();
        if (param.massconvt && param.getMembers) {
            await convertMembers(commandParameters, param.member.library, param.getMembers);
        } else {
            ConfigManager.setParams(commandParameters);
            handleConversion(config, param.member, param.parentnode);
        }
    }
}

async function convertMembers(data: CommandParams, library: string, getMembers: () => Promise<IBMiMember[]>): Promise<void> {
    const sourceMembersList = await getMembers();
    if (!sourceMembersList.length) {
        window.showInformationMessage(l10n.t("No members found to convert"));
        return;
    }
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
            const updatedList = await updateMemberObjectTypes(sourceMembersList, library, progress, token);
            await convertMembersWithProgress(data, updatedList, progress, token);
        });
    }
}


async function convertMembersWithProgress(
    commandParam: CommandParams,
    memberList: { objectType: string, member: IBMiMember }[],
    progress: { report: (value: { increment: number, message: string }) => void },
    token: CancellationToken
): Promise<void> {
    const totalMembers = memberList.length;
    const executionResult: ExecutionReport[] = [];
    let previousPercentCompleted = 0;

    for (let i = 0; i < totalMembers; i++) {
        if (token.isCancellationRequested) {
            window.showInformationMessage(l10n.t("Conversion cancelled"));
            break;
        }
        const member = memberList[i].member;
        commandParam.OBJTYPE = memberList[i].objectType;
        await convertMember(commandParam, member, executionResult);
        const currentPercentCompleted = ((i + 1) / totalMembers) * 100;
        const increment = currentPercentCompleted - previousPercentCompleted;
        previousPercentCompleted = currentPercentCompleted;
        progress.report({ increment, message: l10n.t("Performed Conversion for {0} of {1} members", i + 1, totalMembers) });
    }

    if (executionResult.length === totalMembers) {
        window.showInformationMessage(
            l10n.t("All members converted successfully!"),
            l10n.t("Show Conversion Report")
        ).then((selection) => {
            if (selection === l10n.t("Show Conversion Report")) {
                showConversionReport(executionResult);
            }
        });
    }
}


async function convertMember(
    data: CommandParams,
    member: IBMiMember,
    executionResult: ExecutionReport[]
): Promise<void> {
    const cmd = generateCommand(data, member);
    const result = await executeConversionCommand(cmd);
    if (result) {
        executionResult.push({ sourceMember: member, result });
    }
}

function showConversionReport(report: ExecutionReport[]): void {
    const resultWindow = commandReportUI(report);
    resultWindow.loadPage(l10n.t("Conversion Report"));
}

async function updateMemberObjectTypes(members: IBMiMember[], memberLibrary: string, progress: { report: (value: { increment: number, message: string }) => void }, token: CancellationToken): Promise<{ objectType: string, member: IBMiMember }[]> {
    const connection = Code4i.getConnection();


    const libraries = [memberLibrary, ...(connection.config?.libraryList || []).filter(l => l !== memberLibrary)];
    const cache: { [name: string]: string } = {};

    const rows = await connection.runSQL(`select OBJNAME, OBJTYPE from table (QSYS2.OBJECT_STATISTICS('${memberLibrary}','PGM MODULE','*ALL'))`);
    rows.forEach(row => {
        if (row.OBJNAME !== null) {
            cache[row.OBJNAME] = String(row.OBJTYPE);
        }
    });

    const findObjectType = async (name: string): Promise<string> => {
        if (cache[name]) {
            return cache[name];
        }
        for (const lib of libraries) {
            const [row] = await connection.runSQL(`select OBJNAME, OBJTYPE from table (QSYS2.OBJECT_STATISTICS('${lib}','PGM MODULE','${name}'))`);
            if (row) {
                return String(row.OBJTYPE);
            }
        }
        return "*NONE";
    };

    const result = [];

    for (const member of members) {
        if (token.isCancellationRequested) {
            window.showInformationMessage(l10n.t("Process cancelled"));
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        progress.report({ increment: 0, message: l10n.t("Updating object type for {0}", member.name) });
        const objectType = await findObjectType(member.name);
        result.push({ objectType, member });
    }

    return result;
}
export async function addMembersToConversionList(members: IBMiMember[] | IMemberItem): Promise<void> {
    try {
        const conversionList = await ConfigManager.getConversionList();
        if (!conversionList) {
            window.showErrorMessage(l10n.t("Failed to fetch the conversion list."));
        }
        if (conversionList.length === 0) {
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

        let membersToAdd: IBMiMember[] = [];

        if (Array.isArray(members)) {
            const selectedMembers = await window.showQuickPick(
                members.map(member => member.name),
                { title: l10n.t("Select Members to Add"), canPickMany: true }
            );

            if (!selectedMembers || selectedMembers.length === 0) {
                window.showInformationMessage(l10n.t("No members selected."));
                return;
            }

            membersToAdd = members.filter(member => selectedMembers && selectedMembers.includes(member.name));
        } else {
            membersToAdd = [members.member];
        }

        if (membersToAdd.length === 0) {
            window.showInformationMessage(l10n.t("No members to add."));
            return;
        }

        const existingMembers = selectedList ? new Set(selectedList.items.map(item => item.member)) : new Set();
        const newMembers = membersToAdd.filter(member => !existingMembers.has(member.name));

        if (newMembers.length === 0) {
            window.showInformationMessage(l10n.t("All selected members already exist in the conversion list."));
        }


        if (membersToAdd.length > newMembers.length) {
            const existingMemberNames = membersToAdd
                .filter(member => existingMembers.has(member.name))
                .map(member => member.name)
                .join(', ');

            window.showInformationMessage(
                l10n.t("The following members already exist in the conversion list: {0}", existingMemberNames)
            );
        }

        if (selectedList) {
            addMembersToList(selectedList, newMembers);
            await ConfigManager.updateConversionList(selectedList);
        }


        const message = newMembers.length > 1 ? "Members" : "Member" + " added to the conversion list.";
        window.showInformationMessage(l10n.t(message));

        refreshListExplorer();
    } catch (error) {
        window.showErrorMessage(l10n.t("An error occurred while adding members to the conversion list."));
        console.error(error);
    }
}

function addMembersToList(list: ConversionList, members: IBMiMember[]): void {
    members.forEach(memberItem => {
        list.items.push({
            conversiondate: memberItem.created || "",
            library: memberItem.library,
            member: memberItem.name,
            message: "",
            objtype: "",
            srctype: memberItem.extension,
            status: 0,
            targetmember: memberItem.name
        });
    });
}


