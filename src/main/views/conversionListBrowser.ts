import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import {
    commands,
    l10n,
    MarkdownString,
    ProgressLocation,
    ProviderResult,
    TreeItemCollapsibleState,
    window
} from "vscode";
import { CommandParams, ConfigManager } from "../../configuration";
import { refreshListExplorer } from "../../extension";
import { convertMembersWithProgress, ExecutionReport } from "../controller";
import { openMember } from "../conversion";
import { ConversionListItemStepper } from "../conversion-item";
import { ConversionStatus, getConversionStatus, getStatusColorFromCode, setConverionStatus } from "../conversionMessage";
import { createTargetLibTabs, setupTabWindow } from "../webviews/panel";
import { ExplorerDataProvider, ExplorerNode } from "./common";

export interface ConversionItem {
    targetmember: string;
    status: ConversionStatus;
    srctype: string;
    objtype: string;
    message: string;
    member: string;
    library: string;
    conversiondate: Date | string;
}

export interface ConversionList {
    connectionname: string;
    listname: string;
    description: string;
    targetlibrary: string;
    targetsourcefile: string;
    items: ConversionItem[];
}

const statusSuffixes: { [key in ConversionStatus]: string } = {
    [ConversionStatus.NA]: '',
    [ConversionStatus.SUCCEED]: l10n.t('_succeed'),
    [ConversionStatus.WARNING]: l10n.t('_warning'),
    [ConversionStatus.FAILED]: l10n.t('_failed')
};


export class ConversionListProvider extends ExplorerDataProvider {
    getRootNodes() {
        return ConfigManager.getConversionList().then((lists) => {
            if (lists.length) {
                return lists.map((list) => new ConversionListNode(list));
            } else {
                return [new NoListItem()];
            }
        });
    }

    public addNewConversionList(): void {
        ConversionListItemStepper().then(async (item) => {
            if (item) {
                ConfigManager.addConversionList(item).then(() => {
                    window.showInformationMessage(l10n.t("Conversion list added successfully."));
                    this.refresh();
                });
            }
        });
    }
}

class NoListItem extends ExplorerNode {
    constructor() {
        super(
            l10n.t("Create new conversion list"),
            "noList",
            TreeItemCollapsibleState.None,
            { codicon: 'add', themeColor: 'info', refreshable: false }
        );
        this.command = {
            command: "tfrrpg-list-create",
            title: l10n.t("Add new conversion list")
        };
    }

    getChildren(): ProviderResult<ExplorerNode[]> {
        return [];
    }
}

export abstract class BaseConversionNode extends ExplorerNode {
    async updateObjectTypeForMembers(items: ConversionItem[], parentLabel: string): Promise<void> {
        const objectTypes = ["*PGM", "*MODULE", "*NONE"];
        const response = await window.showQuickPick(objectTypes, { placeHolder: l10n.t("Select member type") });

        if (response) {
            for (const item of items) {
                item.objtype = response;
                await ConfigManager.updateConversionItem(parentLabel, item.member, item);
            }
            refreshListExplorer(this.parent);
        }
    }

    async convertMembers(members: IBMiMember[], targetlibrary: string, targetFile: string, name: string): Promise<ExecutionReport[]> {
        const config = ConfigManager.getParams();
        if (!config) { return []; }

        const tabs = createTargetLibTabs(config);
        const tabwindow = setupTabWindow(tabs);

        const page = await tabwindow.loadPage<any>(l10n.t("ARCAD-Transformer RPG: {0}", name));
        if (page?.data) {
            page.panel.dispose();
            const commandParameters = page.data as CommandParams;
            commandParameters.TOSRCLIB = targetlibrary;
            commandParameters.TOSRCFILE = targetFile;
            return await window.withProgress({
                location: ProgressLocation.Notification,
                title: l10n.t("TFRRPG"),
                cancellable: true
            }, async (progress, token) => {
                return await convertMembersWithProgress(commandParameters, members, progress, token, name).then((report) => {
                    return report || [];
                });
            });
        }
        return [];
    }

    validateObjectType(conversionItems: ConversionItem[]): boolean {
        return conversionItems.every(item => item.objtype !== "");
    }
}

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
        this.description = list.connectionname.toUpperCase();
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
                    const ibmiMembers: IBMiMember[] = selectedItems.map(member => ({
                        extension: member.srctype,
                        file: member.targetmember,
                        library: member.library,
                        name: member.member,
                        objtype: member.objtype
                    }));
                    const report = await this.convertMembers(ibmiMembers, listItem.targetlibrary, listItem.targetsourcefile, this.conversionList.listname);
                    if (report.length) {
                        this.conversionList.items.forEach((item, index) => {
                            item.status = setConverionStatus(report[index].result.stdout || report[index].result.stderr || "");
                            item.message = report[index].result.stderr || report[index].result.stdout || "";

                            item.conversiondate = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
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
        tooltip.appendMarkdown(l10n.t(`$(library) Library: {0}  \n`, listItem.targetlibrary));
        tooltip.appendMarkdown(l10n.t(`$(file-code) Source File: {0}  \n`, listItem.targetsourcefile));
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

export class ConversionItemNode extends BaseConversionNode {
    private readonly conversionItem: ConversionItem;
    parent: ConversionListNode;

    constructor(item: ConversionItem, parent: ConversionListNode) {
        const status = getStatusColorFromCode(item.status);
        const suffix = statusSuffixes[item.status] || '';
        super(
            item.member,
            `conversionItem${suffix}`,
            TreeItemCollapsibleState.None,
            { codicon: 'settings-gear', themeColor: status, refreshable: true },
            parent
        );
        this.description = `${item.member} | ${item.objtype}`;
        this.tooltip = this.getTooltip(item);
        this.conversionItem = item;
        this.parent = parent;
    }

    getChildren(): ProviderResult<ExplorerNode[]> {
        return [];
    }

    getTooltip(listItem: ConversionItem): MarkdownString {
        const tooltip = new MarkdownString();
        tooltip.supportThemeIcons = true;
        tooltip.appendMarkdown(l10n.t(`$(symbol-interface)Member Name: {0}  \n`, listItem.member));
        tooltip.appendMarkdown(l10n.t(`$(library)Source Library: {0}  \n`, listItem.library));
        tooltip.appendMarkdown(l10n.t(`$(file-code) Source File: {0}  \n`, listItem.targetmember));
        tooltip.appendMarkdown(l10n.t(`$(link) Source Type: {0}  \n`, listItem.srctype));
        tooltip.appendMarkdown(l10n.t(`$(comment) Object Type: {0}  \n`, listItem.objtype));
        tooltip.appendMarkdown(l10n.t(`$(comment) Conversion Date: {0}  \n`, listItem.conversiondate.toString()));
        tooltip.appendMarkdown(l10n.t(`$(comment) Status: {0}  \n`, getConversionStatus(listItem.status)));
        tooltip.appendCodeblock(listItem.message);

        return tooltip;
    }

    removeMemberFromList(node: ExplorerNode): void {
        if (node.label) {
            window.showInformationMessage(l10n.t('Are you sure you want to remove {0} from the list?', node.label as string), l10n.t("Yes"), l10n.t("No")).then(async (response) => {
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
        if (this.conversionItem.objtype === "") {
            window.showWarningMessage(l10n.t("Please update object type for this member."));
            return;
        }
        const conversionList = this.parent.conversionList;
        if (conversionList) {
            this.convertMembers(
                [{
                    extension: this.conversionItem.srctype,
                    file: this.conversionItem.targetmember,
                    library: this.conversionItem.library,
                    name: this.conversionItem.member,
                    objtype: this.conversionItem.objtype
                }],
                conversionList.targetlibrary,
                conversionList.targetsourcefile,
                this.conversionItem.member
            ).then((report) => {
                if (report.length) {
                    this.conversionItem.status = setConverionStatus(report[0].result.stdout || report[0].result.stderr || "");
                    this.conversionItem.message = report[0].result.stderr || report[0].result.stdout || "";
                    this.conversionItem.conversiondate = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
                    ConfigManager.updateConversionItem(conversionList.listname, this.conversionItem.member, this.conversionItem).then(() => {
                        refreshListExplorer(this.parent);
                    });

                    if (this.conversionItem.status === ConversionStatus.SUCCEED || this.conversionItem.status === ConversionStatus.WARNING) {
                        openMember({
                            library: conversionList.targetlibrary,
                            file: conversionList.targetsourcefile,
                            name: this.conversionItem.member,
                            extension: this.conversionItem.srctype
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
            name: this.conversionItem.member,
            extension: this.conversionItem.srctype
        }, false);
    }

    editConvertedMember(): void {
        openMember({
            library: this.parent.conversionList?.targetlibrary ?? "",
            file: this.parent.conversionList?.targetsourcefile ?? "",
            name: this.conversionItem.member,
            extension: this.conversionItem.srctype
        }, false);
    }
}




