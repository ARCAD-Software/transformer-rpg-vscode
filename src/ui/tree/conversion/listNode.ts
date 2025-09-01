import { TreeItemCollapsibleState, window, l10n, MarkdownString, commands } from "vscode";
import { ConfigManager } from "../../../config/configuration";
import { refreshListExplorer } from "../../../extension";
import { setConverionStatus } from "../../../utils/messages";
import { ConversionItemNode } from "./itemNode";
import { BaseConversionNode } from "./baseNode";
import { ConversionList } from "../../../models/conversionListBrowser";
import { ExplorerNode } from "../common/explorerNode";
import { ConversionTarget } from "../../../models/conversionTarget";

export class ConversionListNode extends BaseConversionNode {
    conversionList: ConversionList | undefined;

    constructor(conversionList: ConversionList) {
        super(
            conversionList.listname.toUpperCase(),
            "conversionList",
            TreeItemCollapsibleState.Collapsed,
            {
                codicon: 'layers',
                themeColor: 'gitDecoration.modifiedResourceForeground',
                refreshable: true
            }
        );

        this.tooltip = this.getTooltip(conversionList);
        this.description = `${conversionList.targetlibrary} | ${conversionList.targetsourcefile} | ${conversionList.connectionname.toUpperCase()}`;
        this.conversionList = conversionList;
    }

    async getChildren(): Promise<ExplorerNode[]> {
        const conversionLists = await ConfigManager.getConversionList();
        const matchingList = conversionLists.find(
            list => list.listname.toUpperCase() === this.label
        );

        if (!matchingList || matchingList.items.length === 0) {
            return [];
        }

        return matchingList.items.map(
            item => new ConversionItemNode(item, this)
        );
    }


    async updateMemberObjectType(): Promise<void> {
        const conversionLists = await ConfigManager.getConversionList();
        const currentList = conversionLists.find(
            list => list.listname.toUpperCase() === this.label
        );

        if (!currentList || currentList.items.length === 0) {
            return;
        }

        const availableMembers = currentList.items.map(item => item.member);

        const selectedMembers = await window.showQuickPick(
            availableMembers,
            {
                placeHolder: l10n.t("Select members to update"),
                canPickMany: true
            }
        );

        if (!selectedMembers || selectedMembers.length === 0) {
            return;
        }

        const membersToUpdate = currentList.items.filter(item =>
            selectedMembers.includes(item.member)
        );

        await this.updateObjectTypeForMembers(
            membersToUpdate,
            this.label?.toString() ?? ""
        );
    }


    async processBatchConversion(): Promise<void> {
        if (!this.conversionList) {
            return;
        }

        const conversionList = this.conversionList;

        if (conversionList.items.length === 0) {
            return;
        }

        const availableItems = conversionList.items
            .filter(item => item.objtype !== '')
            .map(item => item.member);

        const selectedMembers = await window.showQuickPick(
            availableItems,
            {
                placeHolder: l10n.t("Select members to convert"),
                canPickMany: true
            }
        );

        if (!selectedMembers) {
            return;
        }

        const selectedItems = conversionList.items.filter(item =>
            selectedMembers.includes(item.member)
        );

        if (!this.validateObjectType(selectedItems)) {
            window.showWarningMessage(
                l10n.t("Please update object type for all selected members.")
            );
            return;
        }

        const conversionTargets: ConversionTarget[] = selectedItems.map(item => ({
            extension: item.srctype,
            file: item.targetmember,
            library: item.library,
            member: item.member,
            objectType: item.objtype
        }));

        const conversionReport = await this.convertMembers(
            conversionTargets,
            conversionList.targetlibrary,
            conversionList.targetsourcefile,
            conversionList.listname
        );

        if (conversionReport.length > 0) {
            this.conversionList.items.forEach((item, index) => {
                const reportEntry = conversionReport[index].result;
                const outputMessage = reportEntry.stdout || reportEntry.stderr || "";

                item.status = setConverionStatus(outputMessage);
                item.message = reportEntry.stderr || reportEntry.stdout || "";
                item.conversiondate = new Date().toISOString();
            });

            await ConfigManager.updateConversionList(this.conversionList);
            refreshListExplorer(this);
        }
    }

    private getTooltip(conversionList: ConversionList): MarkdownString {
        const tooltip = new MarkdownString();
        tooltip.supportThemeIcons = true;

        tooltip.appendMarkdown(
            l10n.t(`$(symbol-interface) Name: {0}  \n`, conversionList.listname)
        );
        tooltip.appendMarkdown(
            l10n.t(`$(library) Target Library: {0}  \n`, conversionList.targetlibrary)
        );
        tooltip.appendMarkdown(
            l10n.t(`$(file-code) Target Source File: {0}  \n`, conversionList.targetsourcefile)
        );
        tooltip.appendMarkdown(
            l10n.t(`$(link) Connection: {0}  \n`, conversionList.connectionname)
        );
        tooltip.appendMarkdown(
            l10n.t(`$(comment) Description: {0}  \n`, conversionList.description)
        );

        return tooltip;
    }

    public async deleteConversionList(node: ExplorerNode): Promise<void> {
        if (!node.label) {
            return;
        }

        const userResponse = await window.showInformationMessage(
            l10n.t('Are you sure you want to delete {0}?', node.label as string),
            l10n.t("Yes"),
            l10n.t("No")
        );

        if (userResponse !== l10n.t("Yes")) {
            return;
        }

        await ConfigManager.removeConversionList(node.label as string);
        refreshListExplorer(this.parent);
    }

    public openIBMiObjectBrowser(): void {
        commands.executeCommand("objectBrowser.focus");
    }

}