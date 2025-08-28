import { CommandResult } from "@halcyontech/vscode-ibmi-types";
import { window, ProgressLocation, l10n } from "vscode";
import { Code4i } from "../platform/ibmi/code4i";
import { generateCommand, executeConversionCommand } from "../platform/ibmi/commandRunner";
import { showConversionReport } from "../ui/webviews/panel";
import { CommandParams } from "../models/command";
import { ConversionTarget } from "../models/conversionTarget";


export interface ExecutionReport {
    target: ConversionTarget
    result: CommandResult
}

export async function convertTargets(
    commandParam: CommandParams,
    conversions: ConversionTarget[],
    name: string
): Promise<ExecutionReport[]> {
    return await window.withProgress({
        location: ProgressLocation.Notification,
        title: l10n.t("Converting members"),
        cancellable: true
    }, async (progress, token) => {
        const totalMembers = conversions.length;
        const executionResult: ExecutionReport[] = [];
        const increment = 100 / conversions.length;
        let current = 1;
        let converted = 0;
        for (const conversion of conversions) {
            if (token.isCancellationRequested) {
                window.showInformationMessage(l10n.t("Conversion cancelled"));
                break;
            }

            if (await convertMember(commandParam, conversion, executionResult)) {
                converted++;
            }
            progress.report({
                increment,
                message: l10n.t("{0}/{1}", current++, totalMembers),
            });
        }

        const allConverted = (converted === totalMembers);
        const openReport = (open?: string) => { if (open) { showConversionReport(executionResult, name || ""); } };
        if (allConverted) {
            window.showInformationMessage(totalMembers === 1
                ? l10n.t("Member converted successfully!")
                : l10n.t("All members converted successfully!"),
                l10n.t("Show Conversion Report")
            ).then(openReport);
        }
        else {
            window.showErrorMessage(
                totalMembers === 1
                    ? l10n.t("Member conversion failed!")
                    : l10n.t("{0}/{1} members could not be converted!", totalMembers - converted, totalMembers),
                l10n.t("Show Conversion Report")
            ).then(openReport);
        }

        return executionResult;
    });
}

async function convertMember(
    data: CommandParams,
    member: ConversionTarget,
    executionResult: ExecutionReport[]
) {
    const cmd = await generateCommand(data, member);
    const result = await executeConversionCommand(cmd);
    if (result) {
        executionResult.push({ target: member, result });
    }

    return result && (result.code === 0 || Code4i.getTools().parseMessages(result.stderr || result.stdout).findId("MSG4178"));
}
