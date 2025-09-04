import type { BrowserItem, CommandResult, IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { window, ProgressLocation, l10n, commands } from "vscode";
import { ConversionOKs } from "../utils/messages";
import { Code4i } from "../platform/ibmi/code4i";
import { showConversionReport } from "../ui/webviews/panel";
import { generateCommand, executeConversionCommand } from "../platform/ibmi/commandRunner";
import { CommandParams } from "../models/command";
import { SourceMember } from "../models/conversionTarget";

export async function openMember(param: IBMiMember, readonly: boolean): Promise<void> {
    const path = `${param.library}/${param.file}/${param.name}.${param.extension}`;
    Code4i.open(path, { readonly });
}

export async function handleConversion(params: CommandParams, target: SourceMember, parentnode?: BrowserItem) {
    const command = await generateCommand(params, target);
    window.withProgress({
        location: ProgressLocation.Notification,
        title: l10n.t('Converting {0}', target.name!),
        cancellable: false
    }, async () => {
        try {
            const cmdResult = await executeConversionCommand(command);
            processCommandResult(cmdResult, params, target, parentnode);
        } catch (error: any) {
            window.showErrorMessage(l10n.t('Error: {0}', error.message));
        }
    });
}

function processCommandResult(
    result: CommandResult | undefined,
    params: CommandParams,
    target: SourceMember,
    parentnode?: BrowserItem
) {
    if (result) {
        const openOutput = (open?: string) => { if (open) { showConversionReport([{ result, target }], target.name!); } };
        const messages = Code4i.getTools().parseMessages(result?.stderr || result?.stdout);
        if (result.code === 0 || ConversionOKs.some(messages.findId)) {
            window.showInformationMessage(l10n.t("{0} successfully converted.", target.name!), l10n.t("Show output")).then(openOutput);
            openMember(
                {
                    library: params.TOSRCLIB!,
                    file: params.TOSRCFILE?.toUpperCase() === "*FROMFILE" ? target.file : params.TOSRCFILE?.toUpperCase()!,
                    name: params.TOSRCMBR?.toUpperCase() === "*FROMMBR" && target.name ? target.name : params.TOSRCMBR?.toUpperCase()!,
                    extension: target.extension || "",
                },
                true
            );

            if (parentnode) {
                commands.executeCommand('code-for-ibmi.refreshObjectBrowser', parentnode);
            }
        }
        else {
            window.showErrorMessage(l10n.t("Failed to convert {0}.", target.name!), l10n.t("Show output")).then(openOutput);
        }
    }
}