import vscode from "vscode";
import { Code4i } from "../../code4i";
import { product } from "../../product";
import { ExplorerDataProvider, ExplorerNode } from "./common";

export class ProductStatusDataProvider extends ExplorerDataProvider {
  constructor(context: vscode.ExtensionContext) {
    super();
    context.subscriptions.push(
      vscode.commands.registerCommand("tfrrpg-product-refresh", () => this.refresh()),
      vscode.commands.registerCommand("tfrrpg-product-install", () => this.installProduct()),
      vscode.commands.registerCommand("tfrrpg-product-check-update", () => this.checkUpdate())
    );
    Code4i.subscribe(context,
      vscode.l10n.t("Refresh RPG product view"),
      "connected",
      () => this.refresh()
    );
  }

  protected async getRootNodes() {
    await product.load(true);
    const nodes: ExplorerNode[] = [];
    if (product.getARCADVersion() || product.getStandaloneVersion()) {
      if (product.getStandaloneVersion()) {
        nodes.push(new ProductNode("standalone", product.getStandaloneVersion()));
      }

      if (product.getARCADVersion()) {
        nodes.push(new ProductNode("arcad", product.getARCADVersion()));
      }

      nodes.push(new LicenseNode());
    }
    else {
      nodes.push(new NotInstalledNode());
    }

    return nodes;
  }

  private async installProduct() {
    vscode.window.showInformationMessage("install");
  }

  private async checkUpdate() {
    vscode.window.showInformationMessage("check update");
  }
}

class NotInstalledNode extends ExplorerNode {
  constructor() {
    super(
      vscode.l10n.t("Product is not installed"),
      "notInstalledProductNode",
      vscode.TreeItemCollapsibleState.None,
      { codicon: "circle-slash", themeColor: "errorForeground" }
    );
    this.description = vscode.l10n.t("Click to install");
    this.command = {
      title: "Install ARCAD-Transformer RPG",
      command: "tfrrpg-product-install"
    };
  }
}

class ProductNode extends ExplorerNode {
  constructor(type: "arcad" | "standalone", version: string) {
    super(
      type === "arcad" ? vscode.l10n.t("ARCAD runtime") : vscode.l10n.t("Standalone runtime"),
      `installedProductNode_${type}`,
      vscode.TreeItemCollapsibleState.None,
      { codicon: "circuit-board" }
    );
    this.description = vscode.l10n.t("version {0}", version);
  }
}

class LicenseNode extends ExplorerNode {
  constructor() {
    super(
      vscode.l10n.t("License key"),
      "licenseProductNode",
      vscode.TreeItemCollapsibleState.Collapsed,
      { codicon: "key", refreshable: true });
  }
}