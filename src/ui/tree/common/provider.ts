import * as vscode from "vscode";
import { ExplorerNode } from "./explorerNode";

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