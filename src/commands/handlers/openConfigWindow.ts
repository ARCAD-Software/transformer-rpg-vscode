import { l10n } from "vscode";
import { ConfigManager } from "../../config/configuration";
import { createTabs, setupTabWindow } from "../../ui/webviews/panel";
import type { BrowserItem } from "@halcyontech/vscode-ibmi-types";
import { CommandParams } from "../../models/command";
import { SourceMember } from "../../models/conversionTarget";


export interface ConversionConfiguration {
    member: SourceMember
    parentnode?: BrowserItem
}

export async function openConfigWindow(param: ConversionConfiguration): Promise<CommandParams | void> {
    const config = ConfigManager.getParams();
    if (config) {
        const multiple = !param.member.name;
        const tabs = createTabs(param.member, config);
        const tabwindow = setupTabWindow(tabs, multiple);
        const title = param.member.name || param.member.file;
        const page = await tabwindow.loadPage<CommandParams>(l10n.t("ARCAD-Transformer RPG: {0}", title));

        if (page?.data) {
            const commandParameters = page.data;
            page.panel.dispose();
            return commandParameters;
        }

    }
}