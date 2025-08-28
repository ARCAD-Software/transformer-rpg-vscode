import { window, l10n } from "vscode";
import { ConfigManager } from "../../../config/configuration";
import { refreshListExplorer } from "../../../extension";
import { ConversionItem } from "../../../models/conversionListBrowser";
import { createTargetLibTabs, setupTabWindow } from "../../webviews/panel";
import { ExplorerNode } from "../common/explorerNode";
import { ExecutionReport, convertTargets } from "../../../services/conversionExecutionService";
import { CommandParams } from "../../../models/command";
import { ConversionTarget } from "../../../models/conversionTarget";


export abstract class BaseConversionNode extends ExplorerNode {
    async updateObjectTypeForMembers(items: ConversionItem[], parentLabel: string): Promise<void> {
        const objectTypes = ["*PGM", "*MODULE", "*NONE"];
        const response = await window.showQuickPick(objectTypes, { placeHolder: l10n.t("Select member type") });

        if (response) {
            for (const item of items) {
                item.objtype = response;
                await ConfigManager.updateConversionItem(parentLabel, item.member, item);
            }
            refreshListExplorer(this.parent);
        }
    }

    async convertMembers(members: ConversionTarget[], targetlibrary: string, targetFile: string, name: string): Promise<ExecutionReport[]> {
        const config = ConfigManager.getParams();
        if (!config) { return []; }
        const isMultiple = members.length > 1;
        const tabs = createTargetLibTabs(config);
        const tabwindow = setupTabWindow(tabs, isMultiple);

        const page = await tabwindow.loadPage<any>(l10n.t("ARCAD-Transformer RPG: {0}", name));
        if (page?.data) {
            page.panel.dispose();
            const commandParameters = page.data as CommandParams;
            commandParameters.TOSRCLIB = targetlibrary;
            commandParameters.TOSRCFILE = targetFile;
            return convertTargets(commandParameters, members, name) || [];
        }
        return [];
    }

    validateObjectType(conversionItems: ConversionItem[]): boolean {
        return conversionItems.every(item => item.objtype !== "");
    }
}