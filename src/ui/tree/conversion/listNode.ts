import {
    TreeItemCollapsibleState,
    window,
    l10n,
    MarkdownString,
    commands
} from "vscode";
import { ConfigManager } from "../../../config/configuration";
import { refreshListExplorer } from "../../../extension";
import { setConverionStatus } from "../../../utils/messages";
import { ConversionItemNode } from "./itemNode";
import { BaseConversionNode } from "./baseNode";
import { SourceMemberList } from "../../../models/conversionListBrowser";
import { ExplorerNode } from "../common/explorerNode";
import { SourceMember } from "../../../models/conversionTarget";
import { ExecutionReport } from "../../../services/memberConversionService";

export class ConversionListNode extends BaseConversionNode {
    public conversionList: SourceMemberList;

    constructor(conversionList: SourceMemberList) {
        super(
            conversionList.listname.toUpperCase(),
            "conversionList",
            TreeItemCollapsibleState.Collapsed,
            {
                codicon: "layers",
                themeColor: "gitDecoration.modifiedResourceForeground",
                refreshable: true
            }
        );

        this.description = `${conversionList.targetlibrary} | ${conversionList.targetsourcefile} | ${conversionList.connectionname.toUpperCase()}`;
        this.tooltip = this.buildTooltipDetails(conversionList);
        this.conversionList = conversionList;
    }

    async getChildren(): Promise<ExplorerNode[]> {
        const conversionLists = await ConfigManager.getConversionList();
        const matchingList = conversionLists.find(
            list => list.listname.toUpperCase() === this.label
        );

        if (!matchingList?.items?.length) {
            return [];
        }

        return matchingList.items.map(item => new ConversionItemNode(item, this));
    }

   
    async updateMemberObjectType(): Promise<void> {
        const conversionLists = await ConfigManager.getConversionList();
        const currentList = conversionLists.find(
            list => list.listname.toUpperCase() === this.label
        );

        if (!currentList?.items?.length) { return; }

        const availableMembers = currentList.items.map(item => item.name);

        const selectedMembers = await window.showQuickPick(availableMembers, {
            placeHolder: l10n.t("Select members to update"),
            canPickMany: true
        });

        if (!selectedMembers?.length) { return; }

        const membersToUpdate = currentList.items.filter(item =>
            selectedMembers.includes(item.name)
        );

        await this.updateObjectTypeForMembers(
            membersToUpdate,
            this.label?.toString() ?? ""
        );
    }

    async processBatchConversion(): Promise<void> {
        if (!this.canProcessBatch()) { return; }

        const targets = this.prepareBatchTargets();
        const reports = await this.executeBatchConversion(targets);

        if (!reports?.length) { return; }

        this.updateBatchItems(reports);
        await this.persistConversionList(this.conversionList);
        this.refreshExplorer();
    }

    private canProcessBatch(): boolean {
        if (!this.conversionList?.items?.length) { return false; }

        if (!this.validateObjectTypes(this.conversionList.items)) {
            window.showWarningMessage(
                l10n.t("Please update object type for all selected members.")
            );
            return false;
        }

        return true;
    }
    private prepareBatchTargets(): SourceMember[] {
        return this.conversionList.items.map(item => ({
            ...item,
            file: item.targetmember
        }));
    }

    private async executeBatchConversion(
        targets: SourceMember[]
    ): Promise<ExecutionReport[] | undefined> {
        return this.convertMembers(
            targets,
            this.conversionList.targetlibrary,
            this.conversionList.targetsourcefile,
            this.conversionList.listname
        ) as Promise<ExecutionReport[]>;
    }


    private updateBatchItems(reports: ExecutionReport[]): void {
        this.conversionList.items.forEach((item, index) => {
            const report = reports[index]?.result;
            const output = report?.stdout || report?.stderr || "";

            item.status = setConverionStatus(output);
            item.message = output;
            item.date = new Date().toISOString();
        });
    }


    private buildTooltipDetails(conversionList: SourceMemberList): MarkdownString {
        return this.buildTooltip([
            { icon: "symbol-interface", label: "Name", value: conversionList.listname },
            { icon: "library", label: "Target Library", value: conversionList.targetlibrary },
            { icon: "file-code", label: "Target Source File", value: conversionList.targetsourcefile },
            { icon: "link", label: "Connection", value: conversionList.connectionname },
            { icon: "comment", label: "Description", value: conversionList.description }
        ]);
    }


    public async deleteConversionList(node: ExplorerNode): Promise<void> {
        if (!node.label) { return; }

        const userResponse = await window.showInformationMessage(
            l10n.t("Are you sure you want to delete {0}?", node.label as string),
            l10n.t("Yes"),
            l10n.t("No")
        );

        if (userResponse !== l10n.t("Yes")) { return; }

        await ConfigManager.removeConversionList(node.label as string);
        refreshListExplorer(this.parent);
    }

    public openIBMiObjectBrowser(): void {
        commands.executeCommand("objectBrowser.focus");
    }
}
