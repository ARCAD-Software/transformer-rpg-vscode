import { BrowserItem, CommandResult, IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { commands, l10n, ProgressLocation, window } from "vscode";
import { Code4i } from "../code4i";
import { CommandParams } from "../configuration";
import { tfrrpgOutput } from "../extension";
import { generateCommand } from "../rpgcommands/commandUtils";
import { ConversionTarget } from "./model";

const SUCCESS_MSG_IDS = ['MSG3867', 'MSG1234', 'MSG5678'];

export async function handleConversion(params: CommandParams, target: ConversionTarget, parentnode?: BrowserItem) {
    const command = await generateCommand(params, target);
    window.withProgress({
        location: ProgressLocation.Notification,
        title: l10n.t('Executing Conversion Command'),
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
    cmdResult: CommandResult | undefined,
    params: CommandParams,
    target: ConversionTarget,
    parentnode?: BrowserItem
) {
    if (!cmdResult) { return; }

    if (cmdResult.code === 0) {
        handleSuccess(cmdResult, params, target, parentnode);
    } else {
        handleError(cmdResult);
    }
}

function handleSuccess(
    cmdResult: CommandResult,
    params: CommandParams,
    target: ConversionTarget,
    parentnode?: BrowserItem
) {
    const successMessage = cmdResult.stdout || cmdResult.stderr || l10n.t('Command executed successfully.');
    window
        .showInformationMessage(successMessage, l10n.t('Show Output'))
        .then(action => {
            if (action) {
                window.showInformationMessage(cmdResult.stdout);
            }
        });

    if (cmdResult.stdout) {
        const messages = Code4i.getTools().parseMessages(cmdResult.stdout);
        const isSuccess = SUCCESS_MSG_IDS.some((msgId) => messages.findId(msgId));
        if (isSuccess) {
            openMember(
                {
                    library: params.TOSRCLIB,
                    file: params.TOSRCFILE.toUpperCase() === "*FROMFILE" ? target.file : params.TOSRCFILE.toUpperCase(),
                    name: params.TOSRCMBR.toUpperCase() === "*FROMMBR" && target.member ? target.member : params.TOSRCMBR.toUpperCase(),
                    extension: target.extension ?? "",
                },
                true
            );

            if (parentnode) {
                commands.executeCommand('code-for-ibmi.refreshObjectBrowser', parentnode);
            }
        }
    }
}

function handleError(cmdResult: CommandResult) {
    const errorMessage = cmdResult.stderr || l10n.t('An error occurred while executing the command.');
    window.showErrorMessage(errorMessage);
}

export async function openMember(param: IBMiMember, readonly: boolean): Promise<void> {
    const path = `${param.library}/${param.file}/${param.name}.${param.extension}`;
    Code4i.open(path, { readonly });
}

export async function executeConversionCommand(command: string): Promise<CommandResult | undefined> {
    try {
        return await Code4i.getConnection().runCommand({ command });
    } catch (error: any) {
        tfrrpgOutput().appendLine(l10n.t('Error executing conversion command: {0}', JSON.stringify(error)));
        window.showErrorMessage(l10n.t('Error executing conversion command'), l10n.t("Open output"));
    }
}

