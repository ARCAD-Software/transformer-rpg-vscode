import vscode, { l10n } from "vscode";
import { Code4i } from "../../code4i";
import { LicenseInformation } from "../../components/TFRRPGLIC";
import { tfrrpgOutput } from "../../extension";
import { product, tfrrpgLanguages } from "../../product";
import { ExplorerDataProvider, ExplorerNode, TextNode } from "./common";

export class ProductStatusDataProvider extends ExplorerDataProvider {
  constructor(context: vscode.ExtensionContext) {
    super();
    context.subscriptions.push(
      vscode.commands.registerCommand("tfrrpg-product-refresh", () => this.refresh()),
      vscode.commands.registerCommand("tfrrpg-product-install", () => this.installProduct()),
      vscode.commands.registerCommand("tfrrpg-product-update", () => this.installProduct()),
      vscode.commands.registerCommand("tfrrpg-product-check-update", () => this.checkUpdate()),
      vscode.commands.registerCommand("tfrrpg-product-check-license", () => this.applyLicense(true)),
      vscode.commands.registerCommand("tfrrpg-product-apply-license", () => this.applyLicense()),
      vscode.commands.registerCommand("tfrrpg-product-change-language", () => this.changeLanguage())
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
    if (product.isInstalled()) {
      if (product.getStandaloneVersion()) {
        nodes.push(new ProductNode("standalone", product.getStandaloneVersion()));
      }

      if (product.getARCADVersion()) {
        nodes.push(new ProductNode("arcad", product.getARCADVersion()));
      }
      const license = await product.getCurrentLicense();
      nodes.push(new LicenseNode(license));
    }
    else {
      nodes.push(new NotInstalledNode());
    }

    return nodes;
  }

  private async installProduct(file?: vscode.Uri) {
    const updatePackage = file || (await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { 'Save File': ["savf"] },
      title: l10n.t("Select ARCAD-Transformer RPG save file")
    }))?.at(0);

    if (updatePackage && await product.install(updatePackage)) {
      vscode.window.showInformationMessage(product.isInstalled() ? l10n.t("ARCAD-Transformer RPG successfully updated.") : l10n.t("ARCAD-Transformer RPG successfully installed."));
      this.refresh();
    }
  }

  private async checkUpdate() {
    //TODO: implement
    vscode.window.showInformationMessage(l10n.t("No runtime update availble"));
  }

  private async applyLicense(checkOnly?: boolean) {
    const prompt = checkOnly ? l10n.t("Enter the license key to check") : l10n.t("Enter the license key to apply");
    const key = await vscode.window.showInputBox({ prompt, placeHolder: l10n.t("License key") });
    if (key) {
      const result = await product.applyLicense(key, checkOnly);
      if (result?.message) {
        if (result.message.type === "*ESCAPE") {
          vscode.window.showWarningMessage(result.message.text, { modal: true, detail: result.message.help });
        }
        else {
          vscode.window.showInformationMessage(result.message.text, { modal: true, detail: result.message.help });
          if (!checkOnly) {
            this.refresh();
          }
        }
      }
    }
  }

  private async changeLanguage() {
    const language = (await vscode.window.showQuickPick(
      Object.entries(tfrrpgLanguages).map(([language, label]) => ({ label, language })),
      { title: l10n.t("Select ARCAD-Transformer RPG Standalone language") })
    )?.language;

    if (language) {
      const result = await product.changeLanguage(language);
      const messages = Code4i.getTools().parseMessages(result.stderr || result.stdout);
      if (!result.code) {
        vscode.window.showInformationMessage(messages.findId("MSG4139")?.text || messages.findId("MSG4140")?.text || result.stderr);
      }
      else {
        vscode.window.showWarningMessage(l10n.t("Failed to change ARCAD-Transformer RPG language"),
          { modal: true, detail: messages.messages.map(m => `[${m.id}] ${m.text}`).join("\n") });
        tfrrpgOutput().appendLine(l10n.t("Failed to change ARCAD-Transformer RPG language: {0}", JSON.stringify(result)));
      }
    }
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
  constructor(readonly license?: LicenseInformation) {
    super(
      license ? vscode.l10n.t("License key") : l10n.t("No license key"),
      "licenseProductNode",
      vscode.TreeItemCollapsibleState.Collapsed,
      { codicon: license ? "key" : "circle-slash" });

    this.tooltip = license?.message?.text;

    if (license?.key) {
      switch (license.key) {
        case "*PERM":
          this.description = l10n.t("Permanent");
          break;
        case "*TEMP":
          this.description = l10n.t("Temporary");
          break;

        default:
          this.description = l10n.t("Suspended");
          break;
      }
    }
  }

  getChildren() {
    const nodes: ExplorerNode[] = [];
    if (this.license) {
      nodes.push(
        new TextNode(l10n.t("LPAR Serial"), { description: this.license.serial, icon: "symbol-numeric" }),
        new TextNode(l10n.t("Version"), { description: this.license.arcadVersion, icon: "circuit-board" })
      );

      if (this.license.temporaryUnits?.maxDate) {
        nodes.push(new TextNode(l10n.t("Limit date"), { description: this.license.temporaryUnits.maxDate, icon: "calendar" }));
      }

      const total = (this.license.permanentUnits || this.license.temporaryUnits)?.total || 0;
      const used = (this.license.permanentUnits || this.license.temporaryUnits)?.used || 0;
      nodes.push(
        new TextNode(l10n.t("Total units"), { description: String(total) }),
        new TextNode(l10n.t("Used units"), { description: String(used) }),
        new TextNode(l10n.t("Remaining units"), { description: String(total - used) })
      );

    }
    return nodes;
  }
}