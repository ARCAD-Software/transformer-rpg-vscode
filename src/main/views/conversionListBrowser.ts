import {
    CancellationToken,
    commands,
    Event,
    EventEmitter,
    l10n,
    MarkdownString,
    ProviderResult,
    ThemeColor,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    window
} from "vscode";
import { ConfigManager } from "../../configuration";
import { ConversionListItemStepper } from "../conversion-item";
import { refreshListExplorer } from "../../extension";
import { showInformationMessage } from "../utilities";

enum ConversionStatus {
    None = -1,
    Pass = 0,
    Failed = 1,
}

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
    listdescription: string;
    library: string;
    sourcefile: string;
    items: ConversionItem[];
}


export class ConversionListProvider implements TreeDataProvider<ExplorerNode> {
    private _onDidChangeTreeData: EventEmitter<ExplorerNode | undefined | void> = new EventEmitter<ExplorerNode | undefined | void>();
    readonly onDidChangeTreeData: Event<ExplorerNode | undefined | void> = this._onDidChangeTreeData.event;

    constructor() {
        this.loadConversionList();
    }

    getTreeItem(element: ExplorerNode): TreeItem | Thenable<TreeItem> {
        return element;
    }

    getChildren(element?: ExplorerNode): ProviderResult<ExplorerNode[]> {
        if (element) {
            return element.getChildren();
        } else {
            return ConfigManager.getConversionList().then((lists) => {
                return lists.map((list) => new ConversionListNode(list));
            });
        }
    }

    resolveTreeItem(item: TreeItem, element: ExplorerNode, token: CancellationToken): ProviderResult<TreeItem> {
        return item;
    }

    refresh(node?: ExplorerNode): void {
        this._onDidChangeTreeData.fire(node);
    }

    private async loadConversionList(): Promise<void> {
        const conversionList = await ConfigManager.getConversionList();
        if (!conversionList.length) {
            window.showInformationMessage("No conversion list found in workspace settings.");
        }
    }

    public addNewConversionList(): void {
        ConversionListItemStepper().then(async (item) => {
            if (item) {
                ConfigManager.addConversionList(item).then(() => {
                    showInformationMessage("Conversion list added successfully.");
                    this.refresh();
                });

            }
        });
    }
}

export abstract class ExplorerNode extends TreeItem {
    constructor(
        label: string,
        contextValue: string,
        collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None,
        options?: { codicon: string, themeColor: string, refreshable: boolean },
        readonly parent?: ExplorerNode,
    ) {
        super(label, collapsibleState);
        this.contextValue = `${contextValue}${options?.refreshable ? '_reloadable_' : ''}`;
        if (options?.codicon) {
            this.iconPath = new ThemeIcon(options.codicon, options.themeColor ? new ThemeColor(options.themeColor) : undefined);
        }
    }

    abstract getChildren(): ProviderResult<ExplorerNode[]>;
}

export abstract class BaseConversionNode extends ExplorerNode {
    async updateObjectTypeForMembers(items: ConversionItem[], parentLabel: string): Promise<void> {
        const objectTypes = ["*PGM", "*MODULE", "*NONE"];
        const response = await window.showQuickPick(objectTypes, { placeHolder: "Select member type" });

        if (response) {
            for (const item of items) {
                item.objtype = response;
                await ConfigManager.updateConversionItem(parentLabel, item.targetmember, item);
            }
            refreshListExplorer(this.parent);
        }
    }
}

export class ConversionListNode extends BaseConversionNode {
    constructor(list: ConversionList) {
        super(list.listname.toUpperCase(), "conversionList", TreeItemCollapsibleState.Collapsed, { codicon: 'layers', themeColor: 'gitDecoration.modifiedResourceForeground', refreshable: true });
        this.tooltip = this.getTooltip(list);
        this.description = list.connectionname.toUpperCase();
    }

    async getChildren(): Promise<ExplorerNode[]> {
        const list = await ConfigManager.getConversionList();
        const memberItem = list.find(list => list.listname.toUpperCase() === this.label);
        if (memberItem && memberItem.items.length) {
            return memberItem.items.map((item) => new ConversionItemNode(item, this));
        }
        return [];
    }

    async updateMemberObjectType(): Promise<void> {
        const list = await ConfigManager.getConversionList();
        const memberItem = list.find(list => list.listname.toUpperCase() === this.label);
        // ask user to select the member item to update 
        if (memberItem && memberItem.items.length) {
            const items = memberItem.items;
            const response = await window.showQuickPick(items.map(item => item.targetmember), { placeHolder: "Select members to update", canPickMany: true });
            if (response) {
                const selectedItems = items.filter(item => response.includes(item.targetmember));
                await this.updateObjectTypeForMembers(selectedItems, this.label?.toString() || "");
            }
        }

    }

    getTooltip(listItem: ConversionList) {
        const tooltip = new MarkdownString();
        tooltip.supportThemeIcons = true;
        tooltip.appendMarkdown(l10n.t(`$(symbol-interface) Name: {0}  \n`, listItem.listname));
        tooltip.appendMarkdown(l10n.t(`$(library) Library: {0}  \n`, listItem.library));
        tooltip.appendMarkdown(l10n.t(`$(file-code) Source File: {0}  \n`, listItem.sourcefile));
        tooltip.appendMarkdown(l10n.t(`$(link) Connection: {0}  \n`, listItem.connectionname));
        tooltip.appendMarkdown(l10n.t(`$(comment) Description: {0}  \n`, listItem.listdescription));
        return tooltip;
    }

    public deleteConversionList(node: ExplorerNode): void {
        if (node.label !== undefined) {
            window.showInformationMessage('Are you sure you want to delete ${node.label}?', "Yes", "No").then((response) => {
                if (response === "Yes") {
                    if (node.label !== undefined) {
                        ConfigManager.removeConversionList(node.label.toString()).then(() => {
                            refreshListExplorer(this.parent);
                        });
                    }
                }
            });
        }
    }
}

export class ConversionItemNode extends BaseConversionNode {
    private conversionItem: ConversionItem;

    constructor(item: ConversionItem, parent: ExplorerNode) {
        super(
            item.targetmember,
            "conversionItem",
            TreeItemCollapsibleState.None,
            { codicon: 'file-code', themeColor: 'gitDecoration.ignoredResourceForeground', refreshable: true },
            parent
        );
        this.description = item.message;
        this.tooltip = this.getTooltip(item);
        this.conversionItem = item;
    }

    getChildren(): ProviderResult<ExplorerNode[]> {
        return [];
    }

    getTooltip(listItem: ConversionItem): MarkdownString {
        const tooltip = new MarkdownString();
        tooltip.supportThemeIcons = true;
        tooltip.appendMarkdown(l10n.t(`$(symbol-interface)Member Name: {0}  \n`, listItem.targetmember));
        tooltip.appendMarkdown(l10n.t(`$(library)Source Library: {0}  \n`, listItem.library));
        tooltip.appendMarkdown(l10n.t(`$(file-code) Source Member: {0}  \n`, listItem.member));
        tooltip.appendMarkdown(l10n.t(`$(link) Source Type: {0}  \n`, listItem.srctype));
        tooltip.appendMarkdown(l10n.t(`$(comment) Object Type: {0}  \n`, listItem.objtype));
        tooltip.appendMarkdown(l10n.t(`$(comment) Conversion Date: {0}  \n`, listItem.conversiondate.toString()));
        tooltip.appendMarkdown(l10n.t(`$(comment) Status: {0}  \n`, listItem.status === 0 ? "Pass" : "Failed"));
        tooltip.appendCodeblock(listItem.message);

        return tooltip;
    }

    removeMemberFromList(node: ExplorerNode): void {
        if (node.label) {
            window.showInformationMessage('Are you sure you want to remove ${node.label} from the list?', "Yes", "No").then(async (response) => {
                if (response === "Yes" && node.parent?.label && node.label) {
                    await ConfigManager.removeConversionItem(node.parent.label.toString(), node.label.toString());
                    refreshListExplorer(node.parent);
                }
            });
        }
    }

    async updateMemberObjectType(): Promise<void> {
        await this.updateObjectTypeForMembers([this.conversionItem], this.parent?.label?.toString() || "");
    }

    async convertMember(): Promise<void> {
       
    }
}




