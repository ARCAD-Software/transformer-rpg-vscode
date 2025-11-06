import { l10n, TreeItemCollapsibleState, ProviderResult } from "vscode";
import { ExplorerNode } from "../common/explorerNode";

export class NoListItem extends ExplorerNode {
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