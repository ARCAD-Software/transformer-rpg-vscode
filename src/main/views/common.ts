import vscode from "vscode";
export abstract class ExplorerNode extends vscode.TreeItem {
    constructor(
        label: string,
        contextValue: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        options?: { codicon?: string, themeColor?: string, refreshable?: boolean },
        readonly parent?: ExplorerNode,
    ) {
        super(label, collapsibleState);
        this.contextValue = `${contextValue}${options?.refreshable ? '_reloadable_' : ''}`;
        if (options?.codicon) {
            this.iconPath = new vscode.ThemeIcon(options.codicon, options.themeColor ? new vscode.ThemeColor(options.themeColor) : undefined);
        }
    }

    getChildren?(): vscode.ProviderResult<ExplorerNode[]>;
}

export abstract class ExplorerDataProvider implements vscode.TreeDataProvider<ExplorerNode> {
    private eventEmitter = new vscode.EventEmitter<ExplorerNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ExplorerNode | undefined | void> = this.eventEmitter.event;

    getTreeItem(element: ExplorerNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: ExplorerNode) {
        if (element) {
            return element.getChildren?.();
        }
        else {
            return this.getRootNodes();
        }
    }

    protected abstract getRootNodes(): vscode.ProviderResult<ExplorerNode[]>;

    getParent(element: ExplorerNode) {
        return element.parent;
    }

    refresh(element?: ExplorerNode) {
        this.eventEmitter.fire(element);
    }
}