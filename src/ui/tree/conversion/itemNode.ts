import {
    TreeItemCollapsibleState,
    ProviderResult,
    MarkdownString,
    l10n,
    window
} from "vscode";
import { ConfigManager } from "../../../config/configuration";
import { refreshListExplorer } from "../../../extension";
import {
    getStatusColorFromCode,
    getConversionStatus,
    ConversionStatus
} from "../../../utils/messages";
import { ConversionListNode } from "./listNode";
import { BaseConversionNode } from "./baseNode";
import { SourceMemberItem } from "../../../models/conversionListBrowser";
import { ExplorerNode } from "../common/explorerNode";
import { ExecutionReport } from "../../../services/memberConversionService";
import { SourceMember } from "../../../models/conversionTarget";

const statusSuffixes: Record<ConversionStatus, string> = {
    [ConversionStatus.NA]: "",
    [ConversionStatus.SUCCEED]: l10n.t("_succeed"),
    [ConversionStatus.WARNING]: l10n.t("_warning"),
    [ConversionStatus.FAILED]: l10n.t("_failed"),
};

export class ConversionItemNode extends BaseConversionNode {
    private readonly conversionItem: SourceMemberItem;
    parent: ConversionListNode;

    constructor(item: SourceMemberItem, parent: ConversionListNode) {
        const suffix = statusSuffixes[item.status] ?? "";
        const hasObjectType = !!item.objectType?.trim();
        const readiness = hasObjectType ? "conversionItemReady" : "conversionItemPending";

        let codicon = "settings-gear";
        let themeColor: string = "vscode-editor-foreground";

        if (!hasObjectType) {
            codicon = "circle-large-outline";
            themeColor = "disabledForeground";
        } else {
            switch (item.status) {
                case ConversionStatus.SUCCEED:
                case ConversionStatus.WARNING:
                case ConversionStatus.FAILED:
                    themeColor = getStatusColorFromCode(item.status);
                    codicon =
                        item.status === ConversionStatus.SUCCEED ? "check" :
                            item.status === ConversionStatus.WARNING ? "warning" : "error";
                    break;
                default:
                    codicon = "circle-large-outline";
                    themeColor = "vscode-editor-foreground";
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
        this.tooltip = this.buildTooltipDetails(item);
        this.conversionItem = item;
        this.parent = parent;
    }

    getChildren(): ProviderResult<ExplorerNode[]> {
        return [];
    }


    private buildTooltipDetails(listItem: SourceMemberItem): MarkdownString {
        const tooltip = this.buildTooltip([
            { icon: "symbol-interface", label: "Member Name", value: listItem.name },
            { icon: "library", label: "Source Library", value: listItem.library },
            { icon: "file-code", label: "Source File", value: listItem.targetmember },
            { icon: "link", label: "Source Type", value: listItem.extension },
            { icon: "comment", label: "Object Type", value: listItem.objectType ?? "" },
            { icon: "calendar", label: "Conversion Date", value: listItem.date?.toString() ?? "" },
            { icon: "info", label: "Status", value: getConversionStatus(listItem.status) },
        ]);

        if (listItem.message) {
            tooltip.appendCodeblock(listItem.message);
        }
        return tooltip;
    }

    removeMemberFromList(node: ConversionItemNode): void {
        if (!node.label) { return; }

        window
            .showInformationMessage(
                l10n.t("Are you sure you want to remove {0} from the list?", node.label as string),
                l10n.t("Yes"),
                l10n.t("No")
            )
            .then(async (response) => {
                if (response === l10n.t("Yes") && node.parent?.label && node.label) {
                    await ConfigManager.removeConversionItem(
                        String(node.parent.label),
                        node.label as string
                    );
                    refreshListExplorer(node.parent);
                }
            });
    }

    async updateMemberObjectType(): Promise<void> {
        await this.updateObjectTypeForMembers(
            [this.conversionItem],
            this.parent.label?.toString() ?? ""
        );
    }

    async startSingleItemConversion(): Promise<void> {
        if (!this.validateObjectTypes(this.conversionItem)) { return; }

        const conversionList = this.parent.conversionList;
        if (!conversionList) { return; }

        const member = this.prepareMember(this.conversionItem);

        const report = await this.executeConversion(member, conversionList);
        if (!report) { return; }

        this.updateItemStatus(this.conversionItem, report);
        await this.persistConversionList(conversionList);
        this.refreshExplorer();

        if (this.shouldOpenMember()) {
            this.openConvertedMember(conversionList);
        }
    }

    private async executeConversion(
        member: SourceMember,
        conversionList: any
    ): Promise<ExecutionReport | undefined> {
        return this.convertMembers(
            [member],
            conversionList.targetlibrary,
            conversionList.targetsourcefile,
            member.name
        ) as Promise<ExecutionReport>;
    }

    private shouldOpenMember(): boolean {
        if (this.conversionItem.message?.startsWith("MSG4178")) { return false; }
        return [
            ConversionStatus.SUCCEED,
            ConversionStatus.WARNING
        ].includes(this.conversionItem.status);
    }

    private openConvertedMember(conversionList: any) {
        this.openMemberInEditor(
            conversionList.targetlibrary,
            conversionList.targetsourcefile,
            this.conversionItem.name,
            this.conversionItem.extension,
            true
        );
    }

    public editMember(): void {
        this.openMemberInEditor(
            this.conversionItem.library,
            this.conversionItem.targetmember,
            this.conversionItem.name,
            this.conversionItem.extension,
            false
        );
    }

    public editConvertedMember(): void {
        this.openMemberInEditor(
            this.parent.conversionList?.targetlibrary ?? "",
            this.parent.conversionList?.targetsourcefile ?? "",
            this.conversionItem.name,
            this.conversionItem.extension,
            false
        );
    }
}
