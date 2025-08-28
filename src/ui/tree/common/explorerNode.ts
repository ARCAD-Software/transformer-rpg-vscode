import * as vscode from "vscode";

export class ExplorerNode extends vscode.TreeItem {
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


export class TextNode extends ExplorerNode {
    constructor(label: string, options?: { description?: string, icon?: string, parent?: ExplorerNode }) {
        super(label, label, vscode.TreeItemCollapsibleState.None, { codicon: options?.icon }, options?.parent);
        this.description = options?.description;
    }
}