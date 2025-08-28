import { l10n, TreeItemCollapsibleState } from "vscode";
import { LicenseInformation } from "../../../components/TFRRPGLIC";
import { ExplorerNode, TextNode } from "../common/explorerNode";

export class LicenseNode extends ExplorerNode {
  constructor(readonly license?: LicenseInformation) {
    super(
      license ? l10n.t("License key") : l10n.t("No license key"),
      "licenseProductNode",
      TreeItemCollapsibleState.Collapsed,
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
        new TextNode(l10n.t("LPAR Serial/ID"), { description: `${this.license.serial}/${this.license.lparId}`, icon: "symbol-numeric" }),
        new TextNode(l10n.t("Version"), { description: this.license.arcadVersion, icon: "circuit-board" })
      );

      if (this.license.temporaryUnits.maxDate) {
        nodes.push(new TextNode(l10n.t("Limit date"), { description: this.license.temporaryUnits.maxDate, icon: "calendar" }));
      }

      const total = this.license.permanentUnits.total || this.license.temporaryUnits.total || 0;
      const used = this.license.permanentUnits.total || this.license.temporaryUnits.used || 0;
      nodes.push(
        new TextNode(l10n.t("Total units"), { description: String(total) }),
        new TextNode(l10n.t("Used units"), { description: String(used) }),
        new TextNode(l10n.t("Remaining units"), { description: String(total - used) })
      );

    }
    return nodes;
  }
}