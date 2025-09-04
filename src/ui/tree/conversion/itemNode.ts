import { TreeItemCollapsibleState, ProviderResult, MarkdownString, l10n, window } from "vscode";
import { ConfigManager } from "../../../config/configuration";
import { refreshListExplorer } from "../../../extension";
import { getStatusColorFromCode, getConversionStatus, setConverionStatus, ConversionStatus } from "../../../utils/messages";
import { ConversionListNode } from "./listNode";
import { BaseConversionNode } from "./baseNode";
import { SourceMemberItem } from "../../../models/conversionListBrowser";
import { ExplorerNode } from "../common/explorerNode";
import { openMember } from "../../../services/conversionService";



const statusSuffixes: { [key in ConversionStatus]: string } = {
    [ConversionStatus.NA]: '',
    [ConversionStatus.SUCCEED]: l10n.t('_succeed'),
    [ConversionStatus.WARNING]: l10n.t('_warning'),
    [ConversionStatus.FAILED]: l10n.t('_failed')
};

export class ConversionItemNode extends BaseConversionNode {
    private readonly conversionItem: SourceMemberItem;
    parent: ConversionListNode;

    constructor(item: SourceMemberItem, parent: ConversionListNode) {
        const suffix = statusSuffixes[item.status] || '';
        const hasObjectType = !!(item.objectType && item.objectType.trim() !== '');
        const readiness = hasObjectType ? 'conversionItemReady' : 'conversionItemPending';

        let codicon = 'settings-gear';
        let themeColor: string = 'vscode-editor-foreground';

        if (!hasObjectType) {
            codicon = 'circle-large-outline';
            themeColor = 'disabledForeground';
        } else {
            switch (item.status) {
                case ConversionStatus.SUCCEED:
                    codicon = 'check';
                    themeColor = getStatusColorFromCode(item.status);
                    break;
                case ConversionStatus.WARNING:
                    codicon = 'warning';
                    themeColor = getStatusColorFromCode(item.status);
                    break;
                case ConversionStatus.FAILED:
                    codicon = 'error';
                    themeColor = getStatusColorFromCode(item.status);
                    break;
                case ConversionStatus.NA:
                default:
                    codicon = 'circle-large-outline';
                    themeColor = 'vscode-editor-foreground';
                    break;
            }
        }

        super(
            item.name,
            `${readiness}${suffix}`,
            TreeItemCollapsibleState.None,
            { codicon, themeColor, refreshable: true },
            parent
        );
        this.description = `${item.name} | ${item.objectType}`;
        this.tooltip = this.getTooltip(item);
        this.conversionItem = item;
        this.parent = parent;
    }

    getChildren(): ProviderResult<ExplorerNode[]> {
        return [];
    }

    getTooltip(listItem: SourceMemberItem): MarkdownString {
        const tooltip = new MarkdownString();
        tooltip.supportThemeIcons = true;
        tooltip.appendMarkdown(l10n.t(`$(symbol-interface)Member Name: {0}  \n`, listItem.name));
        tooltip.appendMarkdown(l10n.t(`$(library)Source Library: {0}  \n`, listItem.library));
        tooltip.appendMarkdown(l10n.t(`$(file-code) Source File: {0}  \n`, listItem.targetmember));
        tooltip.appendMarkdown(l10n.t(`$(link) Source Type: {0}  \n`, listItem.extension));
        tooltip.appendMarkdown(l10n.t(`$(comment) Object Type: {0}  \n`, listItem.objectType!));
        tooltip.appendMarkdown(l10n.t(`$(comment) Conversion Date: {0}  \n`, listItem.date.toString()));
        tooltip.appendMarkdown(l10n.t(`$(comment) Status: {0}  \n`, getConversionStatus(listItem.status)));
        tooltip.appendCodeblock(listItem.message);

        return tooltip;
    }

    removeMemberFromList(node: ConversionItemNode): void {
        if (node.label) {
            window.showInformationMessage(l10n.t('Are you sure you want to remove {0} from the list?',
                node.label as string), l10n.t("Yes"), l10n.t("No")).then(async (response) => {
                    if (response === l10n.t("Yes") && node.parent?.label && node.label) {
                        await ConfigManager.removeConversionItem(String(node.parent.label), node.label as string);
                        refreshListExplorer(node.parent);
                    }
                });
        }
    }

    async updateMemberObjectType(): Promise<void> {
        await this.updateObjectTypeForMembers([this.conversionItem], this.parent.label?.toString() ?? "");
    }

    startSingleItemConversion(): void {
        if (this.conversionItem.objectType === "") {
            window.showWarningMessage(l10n.t("Please update object type for this member."));
            return;
        }
        const conversionList = this.parent.conversionList;
        if (conversionList) {
            this.convertMembers(
                [{
                    ...this.conversionItem,
                    file: this.conversionItem.targetmember,
                }],

                conversionList.targetlibrary,
                conversionList.targetsourcefile,
                this.conversionItem.name
            ).then((report) => {
                if (report.length) {
                    this.conversionItem.status = setConverionStatus(report[0].result.stdout || report[0].result.stderr || "");
                    this.conversionItem.message = report[0].result.stderr || report[0].result.stdout || "";
                    this.conversionItem.date = new Date().toISOString();
                    ConfigManager.updateConversionItem(conversionList.listname, this.conversionItem.name, this.conversionItem).then(() => {
                        refreshListExplorer(this.parent);
                    });

                    if (this.conversionItem.message.startsWith('MSG4178')) {
                        return;
                    }

                    if (this.conversionItem.status === ConversionStatus.SUCCEED || this.conversionItem.status === ConversionStatus.WARNING) {
                        openMember({
                            library: conversionList.targetlibrary,
                            file: conversionList.targetsourcefile,
                            name: this.conversionItem.name,
                            extension: this.conversionItem.extension
                        }, true);
                    }
                }
            });
        }
    }

    editMember(): void {
        openMember({
            library: this.conversionItem.library,
            file: this.conversionItem.targetmember,
            name: this.conversionItem.name,
            extension: this.conversionItem.extension
        }, false);
    }

    editConvertedMember(): void {
        openMember({
            library: this.parent.conversionList?.targetlibrary ?? "",
            file: this.parent.conversionList?.targetsourcefile ?? "",
            name: this.conversionItem.name,
            extension: this.conversionItem.extension
        }, false);
    }
}