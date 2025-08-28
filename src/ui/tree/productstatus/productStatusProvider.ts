import { l10n } from "vscode";
import { ConfigManager } from "../../../config/configuration";
import { tfrrpgOutput } from "../../../extension";
import { Code4i } from "../../../platform/ibmi/code4i";
import { product, tfrrpgLanguages } from "../../../product";
import { GitHubREST } from "../../../utils/githubRest";
import { ExplorerNode } from "../common/explorerNode";
import { ExplorerDataProvider } from "../common/provider";
import * as vscode from "vscode";
import { ProductNode } from "./productNode";
import { LicenseNode } from "./licenseNode";

const UPDATE_ASSET = /^Arcad_Transformer_RPG_(\d+\.\d+\.\d+)\.zip$/;

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
            filters: { 'Package': ["savf", "zip"] },
            title: l10n.t("Select ARCAD-Transformer RPG save file")
        }))?.at(0);

        if (updatePackage && await product.install(updatePackage)) {
            vscode.window.showInformationMessage(product.isInstalled() ? l10n.t("ARCAD-Transformer RPG successfully updated.") : l10n.t("ARCAD-Transformer RPG successfully installed."));
            this.refresh();
        }
    }

    private async checkUpdate() {
        const latestUpdate = await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: l10n.t("Checking ARCAD-Transformer RPG updates") }, async () =>
            (await GitHubREST.getReleases())
                .filter(release => ConfigManager.checkPrereleaseUpdates() || (!release.prerelease && !release.draft))
                .map(release => {
                    const updatePackage = release.assets.find(asset => UPDATE_ASSET.test(asset.name));
                    if (updatePackage) {
                        return { ...updatePackage, releaseUrl: release.html_url };
                    }
                })
                .filter(Boolean)
                .at(0)
        );

        if (latestUpdate) {
            const version = UPDATE_ASSET.exec(latestUpdate.name)?.at(1);
            if (version && product.isOlderThan(version)) {
                const open = l10n.t("Show release");
                const install = l10n.t("Download & install");
                vscode.window.showInformationMessage(l10n.t("A standalone runtime update is available ({0})", version), install, open)
                    .then(async action => {
                        if (action === open) {
                            vscode.commands.executeCommand("vscode.open", latestUpdate.releaseUrl);
                        }
                        else if (action === install) {
                            try {
                                const updatePackage = await vscode.window.withProgress({
                                    title: l10n.t("Downloading {0} ({1} MB)", latestUpdate.name, latestUpdate.size / 1048576),
                                    location: vscode.ProgressLocation.Notification
                                }, () => GitHubREST.downloadAsset(latestUpdate));
                                this.installProduct(vscode.Uri.file(updatePackage.name))
                                    .then(() => updatePackage.removeCallback());
                            }
                            catch (error: any) {
                                tfrrpgOutput().appendLine(l10n.t("Error occurred while downloading standalone runtime: {0}", JSON.stringify(error)));
                                vscode.window.showErrorMessage(l10n.t("Could not download ARCAD Transformer RPG standalone runtime"), l10n.t("Open output"))
                                    .then(open => {
                                        if (open) {
                                            tfrrpgOutput().show();
                                        }
                                    });
                            }
                        }
                    });
            }
            else {
                vscode.window.showInformationMessage(l10n.t("You're already using the latest standalone runtime version ({0}).", product.getStandaloneVersion()));
            }
        }
        else {
            vscode.window.showInformationMessage(l10n.t("No standalone runtime update available"));
        }
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
