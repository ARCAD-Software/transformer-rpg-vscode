
import { commands, l10n, ProgressLocation, window, workspace } from "vscode";
import { CommandResult, IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { CommandParams, ConfigManager } from "../configuration";
import { Code4i } from "../code4i";
import { generateCommand } from "../rpgcommands/commandUtils";
import { showErrorMessage } from "./utilities";

const MSGID_SUCCEED = 'MSG3867';

export interface MemberParam {
    library: string;
    file: string;
    name: string;
    extension: string;
}
export function convertBool(value: string): string {
    return value ? '*YES' : '*NO';
}

export async function handleConversion(params: CommandParams, member: IBMiMember, parentnode?: any) {
    const command = generateCommand(params, member);
    window.withProgress({
        location: ProgressLocation.Notification,
        title: l10n.t('Executing Conversion Command'),
        cancellable: false
    }, async () => {
        try {
            const cmdResult = await executeConversionCommand(command);
            processCommandResult(cmdResult, params, member, parentnode);
        } catch (error: any) {
            window.showErrorMessage(error.message);
        }
    });
}

function processCommandResult(cmdResult: CommandResult | undefined, params: CommandParams, member: IBMiMember, parentnode?: any) {
    if (!cmdResult) { return; };

    if (cmdResult.code === 0) {
        window.showInformationMessage(cmdResult.stdout || cmdResult.stderr, { modal: true });
        if (cmdResult.stdout) {
            const messages = Code4i.getTools().parseMessages(cmdResult.stdout);
            if (messages.findId(MSGID_SUCCEED)) {
                openMember({ library: params.TOSRCLIB, file: params.TOSRCFILE, name: params.TOSRCMBR, extension: member.extension },true);
                commands.executeCommand('code-for-ibmi.refreshObjectBrowser', parentnode || '');
            }
        }
    } else {
        window.showErrorMessage(cmdResult.stderr, { modal: true });
    }
}

export async function openMember(param: MemberParam, readonly: boolean): Promise<void> {
    const path = `${param.library}/${param.file}/${param.name}.${param.extension}`;
    Code4i.open(path, { readonly: readonly });
}

export async function executeConversionCommand(command: string): Promise<CommandResult | undefined> {
    try {
        return await Code4i.getConnection().runCommand({ command });
    } catch (error: any) {
        showErrorMessage(l10n.t("Error executing conversion command: {0}", error));
    }
    return undefined;
}

