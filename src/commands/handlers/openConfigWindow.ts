import { l10n } from "vscode";
import { ConfigManager } from "../../config/configuration";
import { createTabs, setupTabWindow } from "../../ui/webviews/panel";
import { convertMultipleMembers } from "../../services/conversionBatchService";
import { handleConversion } from "../../services/conversionService";
import { BrowserItem } from "@halcyontech/vscode-ibmi-types";
import { CommandParams } from "../../models/command";
import { ConversionTarget } from "../../models/conversionTarget";


interface ConversionConfiguration {
    conversionTarget: ConversionTarget
    parentnode?: BrowserItem
}

export async function openConfigWindow(param: ConversionConfiguration): Promise<void> {
    const config = ConfigManager.getParams();
    if (config) {
        const multiple = !param.conversionTarget.member;
        const tabs = createTabs(param.conversionTarget, config);
        const tabwindow = setupTabWindow(tabs, multiple);

        const page = await tabwindow.loadPage<CommandParams>(l10n.t("ARCAD-Transformer RPG: {0}", param.conversionTarget.member || param.conversionTarget.file));
        if (page?.data) {
            const commandParameters = page.data;
            page.panel.dispose();
            if (multiple) {
                await convertMultipleMembers(commandParameters, param.conversionTarget);
            } else {
                if (page.data.buttons === 'convertnsave') {
                    ConfigManager.setParams(commandParameters);
                }
                handleConversion(commandParameters, param.conversionTarget, param.parentnode);
            }
        }
    }
}