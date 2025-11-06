import { window, l10n, MarkdownString } from "vscode";
import { ConfigManager } from "../../../config/configuration";
import { refreshListExplorer } from "../../../extension";
import { SourceMemberItem, SourceMemberList } from "../../../models/conversionListBrowser";
import { createTargetLibTabs, setupTabWindow } from "../../webviews/panel";
import { ExplorerNode } from "../common/explorerNode";
import { CommandParams } from "../../../models/command";
import { SourceMember } from "../../../models/conversionTarget";
import { ExecutionReport, MemberConversionService } from "../../../services/memberConversionService";
import { setConverionStatus } from "../../../utils/messages";
import { Code4i } from "../../../platform/ibmi/code4i";


export abstract class BaseConversionNode extends ExplorerNode {
    async updateObjectTypeForMembers(items: SourceMemberItem[], parentLabel: string): Promise<void> {
        const objectTypes = ["*PGM", "*MODULE", "*NONE"];
        const response = await window.showQuickPick(objectTypes, { placeHolder: l10n.t("Select member type") });

        if (response) {
            for (const item of items) {
                item.objectType = response;
                await ConfigManager.updateConversionItem(parentLabel, item.name, item);
            }
            refreshListExplorer(this.parent);
        }
    }

    async convertMembers(members: SourceMember[], targetlibrary: string, targetFile: string, name: string): Promise<ExecutionReport | ExecutionReport[]> {
        const config = ConfigManager.getParams();
        if (!config) { return []; }
        const isMultiple = members.length > 1;
        const tabs = createTargetLibTabs(config);
        const tabwindow = setupTabWindow(tabs, isMultiple);

        const formData = await tabwindow.loadPage<CommandParams>(l10n.t("ARCAD-Transformer RPG: {0}", name));
        if (formData?.data) {
            formData.panel.dispose();
            const commandParameters = formData.data;
            commandParameters.TOSRCLIB = targetlibrary;
            commandParameters.TOSRCFILE = targetFile;
            if (isMultiple) {
                return await MemberConversionService.convertMultiple(commandParameters, members, false, targetlibrary) || [];
            } else {
                return await MemberConversionService.convertSingle(commandParameters, members[0]) as ExecutionReport;
            }
        }
        return [];
    }

    protected validateObjectTypes(items: SourceMemberItem | SourceMemberItem[]): boolean {
        const list = Array.isArray(items) ? items : [items];
        const isValid = list.every(item => item.objectType?.trim() !== "");

        if (!isValid) {
            window.showWarningMessage(
                l10n.t("Please update object type for all selected members.")
            );
        }

        return isValid;
    }

    protected updateItemStatus(item: SourceMemberItem, report: ExecutionReport): void {
        const output = report.result.stdout || report.result.stderr || "";
        item.status = setConverionStatus(output);
        item.message = report.result.stderr || report.result.stdout || "";
        item.date = new Date().toISOString();
    }

    protected async persistConversionItem(parentLabel: string, item: SourceMemberItem): Promise<void> {
        await ConfigManager.updateConversionItem(parentLabel, item.name, item);
    }

    protected async persistConversionList(list: SourceMemberList): Promise<void> {
        await ConfigManager.updateConversionList(list);
    }

    protected refreshExplorer(node: ExplorerNode = this): void {
        refreshListExplorer(node);
    }

    protected prepareMember(item: SourceMemberItem): SourceMember {
        return { ...item, file: item.targetmember };
    }

    protected prepareMembers(items: SourceMemberItem[]): SourceMember[] {
        return items.map(item => this.prepareMember(item));
    }

    protected buildTooltip(fields: { icon: string, label: string, value: string }[]): MarkdownString {
        const tooltip = new MarkdownString();
        tooltip.supportThemeIcons = true;
        fields.forEach(field =>
            tooltip.appendMarkdown(l10n.t(`$(${field.icon}) ${field.label}: {0}  \n`, field.value))
        );
        return tooltip;
    }

    protected openMemberInEditor(
        library: string,
        file: string,
        name: string,
        extension: string,
        readonly: boolean = false
    ): void {
        const path = `${library}/${file}/${name}.${extension}`;
        Code4i.open(path, { readonly });
    }
}