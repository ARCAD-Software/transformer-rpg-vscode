import { l10n, TreeItemCollapsibleState } from "vscode";
import { ExplorerNode } from "../common/explorerNode";

export class ProductNode extends ExplorerNode {
    constructor(type: "arcad" | "standalone", version: string) {
        super(
            type === "arcad" ? l10n.t("ARCAD runtime") : l10n.t("Standalone runtime"),
            `installedProductNode_${type}`,
            TreeItemCollapsibleState.None,
            { codicon: "circuit-board" }
        );
        this.description = l10n.t("version {0}", version);
    }
}