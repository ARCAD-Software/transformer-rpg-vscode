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

    constructor(list: ConversionList) {
        super(
            list.listname.toUpperCase(),
            "conversionList",
            TreeItemCollapsibleState.Collapsed,
            { codicon: 'layers', themeColor: 'gitDecoration.modifiedResourceForeground', refreshable: true }
        );
        this.tooltip = this.getTooltip(list);
        this.description = `${list.targetlibrary} | ${list.targetsourcefile} | ${list.connectionname.toUpperCase()}`;
        this.conversionList = list;
    }

    async getChildren(): Promise<ExplorerNode[]> {
        const list = await ConfigManager.getConversionList();
        const memberItem = list.find(list => list.listname.toUpperCase() === this.label);
        if (memberItem?.items.length) {
            return memberItem.items.map((item) => new ConversionItemNode(item, this));
        }
        return [];
    }

    async updateMemberObjectType(): Promise<void> {
        const list = await ConfigManager.getConversionList();
        const memberItem = list.find(list => list.listname.toUpperCase() === this.label);
        if (memberItem?.items.length) {
            const items = memberItem.items;
            const response = await window.showQuickPick(items.map(item => item.member),
                { placeHolder: l10n.t("Select members to update"), canPickMany: true });
            if (response) {
                const selectedItems = items.filter(item => response.includes(item.member));
                await this.updateObjectTypeForMembers(selectedItems, this.label?.toString() ?? "");
            }
        }
    }

    async processBatchConversion(): Promise<void> {
        if (this.conversionList) {
            const listItem = this.conversionList;
            if (listItem?.items.length) {
                const items = listItem.items;
                const response = await window.showQuickPick(items.map(item => item.member),
                    { placeHolder: l10n.t("Select members to convert"), canPickMany: true });
                if (response) {
                    const selectedItems = items.filter(item => response.includes(item.member));
                    if (!this.validateObjectType(selectedItems)) {
                        window.showWarningMessage(l10n.t("Please update object type for all selected members."));
                        return;
                    }
                    const ibmiMembers: ConversionTarget[] = selectedItems.map(member => ({
                        extension: member.srctype,
                        file: this.conversionList!.targetsourcefile,
                        library: member.library,
                        member: member.member,
                        objectType: member.objtype
                    }));
                    const report = await this.convertMembers(ibmiMembers, listItem.targetlibrary, listItem.targetsourcefile, this.conversionList.listname);
                    if (report.length) {
                        this.conversionList.items.forEach((item, index) => {
                            item.status = setConverionStatus(report[index].result.stdout || report[index].result.stderr || "");
                            item.message = report[index].result.stderr || report[index].result.stdout || "";
                            item.conversiondate = new Date().toISOString();
                        });
                        await ConfigManager.updateConversionList(this.conversionList);
                        refreshListExplorer(this);
                    }
                }
            }
        }
    }

    getTooltip(listItem: ConversionList): MarkdownString {
        const tooltip = new MarkdownString();
        tooltip.supportThemeIcons = true;
        tooltip.appendMarkdown(l10n.t(`$(symbol-interface) Name: {0}  \n`, listItem.listname));
        tooltip.appendMarkdown(l10n.t(`$(library) Target Library: {0}  \n`, listItem.targetlibrary));
        tooltip.appendMarkdown(l10n.t(`$(file-code) Target Source File: {0}  \n`, listItem.targetsourcefile));
        tooltip.appendMarkdown(l10n.t(`$(link) Connection: {0}  \n`, listItem.connectionname));
        tooltip.appendMarkdown(l10n.t(`$(comment) Description: {0}  \n`, listItem.description));
        return tooltip;
    }

    public deleteConversionList(node: ExplorerNode): void {
        if (node.label !== undefined) {
            window.showInformationMessage(l10n.t('Are you sure you want to delete {0}?', node.label as string), l10n.t("Yes"), l10n.t("No")).then((response) => {
                if (response === l10n.t("Yes")) {
                    if (node.label !== undefined) {
                        ConfigManager.removeConversionList(node.label as string).then(() => {
                            refreshListExplorer(this.parent);
                        });
                    }
                }
            });
        }
    }

    public openIBMiObjectBrowser(): void {
        commands.executeCommand("objectBrowser.focus");
    }
}