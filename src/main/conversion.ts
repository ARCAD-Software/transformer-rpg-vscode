import { BrowserItem, CommandResult, IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { commands, l10n, ProgressLocation, window } from "vscode";
import { Code4i } from "../code4i";
import { tfrrpgOutput } from "../extension";
import { generateCommand } from "../rpgcommands/commandUtils";
import { ConversionOKs } from "./conversionMessage";
import { CommandParams, ConversionTarget } from "./model";
import { showConversionReport } from "./webviews/panel";

export async function handleConversion(params: CommandParams, target: ConversionTarget, parentnode?: BrowserItem) {
    const command = await generateCommand(params, target);
    window.withProgress({
        location: ProgressLocation.Notification,
        title: l10n.t('Converting {0}', target.member!),
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
    target: ConversionTarget,
    parentnode?: BrowserItem
) {
    if (result) {
        const openOutput = (open?: string) => { if (open) { showConversionReport([{ result, target }], target.member!); } };
        const messages = Code4i.getTools().parseMessages(result?.stderr || result?.stdout);
        if (result.code === 0 || ConversionOKs.some(messages.findId)) {
            window.showInformationMessage(l10n.t("{0} successfully converted.", target.member!), l10n.t("Show output")).then(openOutput);
            openMember(
                {
                    library: params.TOSRCLIB!,
                    file: params.TOSRCFILE?.toUpperCase() === "*FROMFILE" ? target.file : params.TOSRCFILE?.toUpperCase()!,
                    name: params.TOSRCMBR?.toUpperCase() === "*FROMMBR" && target.member ? target.member : params.TOSRCMBR?.toUpperCase()!,
                    extension: target.extension || "",
                },
                true
            );

            if (parentnode) {
                commands.executeCommand('code-for-ibmi.refreshObjectBrowser', parentnode);
            }
        }
        else {
            window.showErrorMessage(l10n.t("Failed to convert {0}.", target.member!), l10n.t("Show output")).then(openOutput);
        }
    }
}

export async function openMember(param: IBMiMember, readonly: boolean): Promise<void> {
    const path = `${param.library}/${param.file}/${param.name}.${param.extension}`;
    Code4i.open(path, { readonly });
}

export async function executeConversionCommand(command: string): Promise<CommandResult | undefined> {
    try {
        return await Code4i.getConnection().runCommand({ command, environment: "ile" });
    } catch (error: any) {
        tfrrpgOutput().appendLine(l10n.t('Error executing conversion command: {0}', JSON.stringify(error)));
        window.showErrorMessage(l10n.t('Error executing conversion command'), l10n.t("Open output"));
    }
}

