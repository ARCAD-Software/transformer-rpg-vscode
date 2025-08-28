import { MemberItem, ObjectItem, IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { window, l10n, commands } from "vscode";
import { ConfigManager } from "../../config/configuration";
import { refreshListExplorer, tfrrpgOutput } from "../../extension";
import { ConversionStatus } from "../../utils/messages";
import { ConversionList } from "../../models/conversionListBrowser";
import { getMembersListWithProgress } from "../../services/conversionBatchService";

export async function addMembersToConversionList(node: MemberItem | ObjectItem, nodes: MemberItem[] | ObjectItem[]): Promise<void> {
    try {
        const conversionList = await ConfigManager.getConversionList();

        if (!conversionList.length) {
            await handleNoConversionList();
            return;
        }

        const selectedList = await promptUserToSelectList(conversionList);
        if (!selectedList) { return; }

        const membersToAdd = await getMembersToAdd(node, nodes);
        if (!membersToAdd.length) { return; }

        const newMembers = filterNewMembers(selectedList, membersToAdd);
        if (!newMembers.length) {
            notifyMembersAlreadyExist(selectedList.listname);
            return;
        }

        await updateConversionList(selectedList, newMembers);

        notifyMembersAdded(newMembers.length);

    } catch (error) {
        handleError(error);
    }
}

async function handleNoConversionList(): Promise<void> {
    const selection = await window.showInformationMessage(
        l10n.t("No conversion list found. Create a conversion list first."),
        l10n.t("Create new Conversion List"),
        l10n.t("Cancel")
    );
    if (selection === l10n.t("Create new Conversion List")) {
        await commands.executeCommand('tfrrpg-list-create');
    }
}

async function promptUserToSelectList(
    conversionLists: ConversionList[]
): Promise<ConversionList | undefined> {
    const quickPickItems = conversionLists.map(list => ({
        label: `$(list) ${list.listname}`,
        description: list.description || l10n.t("No description"),
        detail: l10n.t(
            "Library: {0}, Source File: {1}, Items: {2}",
            list.targetlibrary,
            list.targetsourcefile,
            list.items.length
        ),
        list
    }));

    const selected = await window.showQuickPick(quickPickItems, {
        title: l10n.t("Select Conversion List"),
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: l10n.t("Choose a conversion list to continue")
    });

    if (!selected) {
        window.showInformationMessage(l10n.t("No conversion list selected."));
        return undefined;
    }

    return selected.list;
}


async function getMembersToAdd(
    node: MemberItem | ObjectItem,
    nodes?: (MemberItem | ObjectItem)[]
): Promise<IBMiMember[]> {
    return nodes?.length
        ? nodes.filter((n): n is MemberItem => "member" in n).map(n => n.member)
        : "member" in node
            ? [node.member]
            : (await getSelectedMembers(node)) ?? [];
}

function filterNewMembers(selectedList: ConversionList, membersToAdd: IBMiMember[]): IBMiMember[] {
    const existingMembers = new Set(selectedList.items.map(item => item.member));
    return membersToAdd.filter(m => !existingMembers.has(m.name));
}

async function updateConversionList(selectedList: ConversionList, newMembers: IBMiMember[]): Promise<void> {
    addMembersToList(selectedList, newMembers);
    await ConfigManager.updateConversionList(selectedList);
    refreshListExplorer();
}

function notifyMembersAlreadyExist(listName: string): void {
    window.showWarningMessage(
        l10n.t("The selected member(s) already exist in the conversion list: {0}", listName)
    );
}

function notifyMembersAdded(count: number): void {
    window.showInformationMessage(
        l10n.t("{0} added to the conversion list.", count > 1 ? l10n.t("Members") : l10n.t("Member"))
    );
}

function handleError(error: unknown): void {
    window.showErrorMessage(l10n.t("An error occurred while adding members to the conversion list."));
    console.error(error);
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
        window.showErrorMessage(l10n.t("Error selecting members"), l10n.t("Open output"))
            .then(open => {
                if (open) {
                    tfrrpgOutput().show();
                }
            });
        memberQuickPick.dispose();
        return undefined;
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
