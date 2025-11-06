import { window, ProgressLocation, l10n, commands } from "vscode";
import type { BrowserItem, CommandResult } from "@halcyontech/vscode-ibmi-types";
import { generateCommand, executeConversionCommand } from "../platform/ibmi/commandRunner";
import { findObjectType } from "../platform/api";
import { showConversionReport } from "../ui/webviews/panel";
import { Code4i } from "../platform/ibmi/code4i";
import { CommandParams } from "../models/command";
import { SourceMember } from "../models/conversionTarget";



export interface ExecutionReport {
    target: SourceMember
    result: CommandResult
}

export class MemberConversionService {
    static async convertSingle(
        params: CommandParams,
        member: SourceMember,
        parentNode?: BrowserItem
    ): Promise<ExecutionReport | undefined> {
        const command = await generateCommand(params, member);
        return await window.withProgress({
            location: ProgressLocation.Notification,
            title: l10n.t('Converting {0}', member.name),
            cancellable: false
        }, async () => {
            try {
                const result = await executeConversionCommand(command);
                if (!result) { return; }

                const report = { target: member, result };
                this.handleResult(result, member, [report]);

                if (parentNode) {
                    commands.executeCommand('code-for-ibmi.refreshObjectBrowser', parentNode);
                }

                return report;
            } catch (error: any) {
                window.showErrorMessage(l10n.t('Error: {0}', error.message));
                return undefined;
            }
        });
    }


    static async convertMultiple(
        params: CommandParams,
        members: SourceMember[],
        lookUpObject: boolean = false,
        libraryName: string = ""
    ): Promise<ExecutionReport[]> {
        if (lookUpObject) {
            await this.lookupObjectType(libraryName, members);
        }

        return await window.withProgress({
            location: ProgressLocation.Notification,
            title: l10n.t("Converting members"),
            cancellable: true
        }, async (progress, token) => {
            const results: { target: SourceMember, result: CommandResult }[] = [];
            const total = members.length;
            const increment = 100 / total;
            let converted = 0;

            for (let i = 0; i < total; i++) {
                if (token.isCancellationRequested) { break; };

                const member = members[i];
                const command = await generateCommand(params, member);
                const result = await executeConversionCommand(command);

                if (result) {
                    results.push({ target: member, result });
                    if (result.code === 0 || Code4i.getTools().parseMessages(result.stderr || result.stdout).findId("MSG4178")) {
                        converted++;
                    }
                }

                progress.report({ increment, message: `${i + 1}/${total}` });
            }

            this.showBatchResult(results, converted, total);
            return results;
        });
    }

    private static async lookupObjectType(library: string, members: SourceMember[]) {
        const cache = new Map();
        await window.withProgress({
            location: ProgressLocation.Notification,
            title: l10n.t("Looking up members' object types"),
            cancellable: true
        }, async (progress, token) => {
            const increment = 100 / members.length;
            for (let i = 0; i < members.length; i++) {
                if (token.isCancellationRequested) { return; }
                const member = members[i];
                if (member.name) {
                    member.objectType = await findObjectType(library, member.name, cache);
                }
                progress.report({ increment, message: `${i + 1}/${members.length}` });
            }
        });
    }

    private static handleResult(
        result: CommandResult | undefined,
        member: SourceMember,
        executionResult: ExecutionReport[]
    ) {
        if (!result) {
            window.showErrorMessage(l10n.t("Conversion failed for {0}", member.name));
            return;
        }

        const openReport = (open?: string) => { if (open) { showConversionReport(executionResult, member.name!); } };

        if (result.code === 0 || Code4i.getTools().parseMessages(result.stderr || result.stdout).findId("MSG4178")) {
            window.showInformationMessage(l10n.t("{0} successfully converted.", member.name), l10n.t("Show Report")).then(openReport);
        } else {
            window.showErrorMessage(l10n.t("Failed to convert {0}", member.name), l10n.t("Show Report")).then(openReport);
        }
    }


    private static showBatchResult(
        results: ExecutionReport[],
        converted: number,
        total: number
    ) {
        const openReport = (open?: string) => { if (open) { showConversionReport(results, "Batch Conversion"); } };

        if (converted === total) {
            window.showInformationMessage(
                total === 1 ? l10n.t("Member converted successfully!") : l10n.t("All members converted successfully!"),
                l10n.t("Show Conversion Report")
            ).then(openReport);
        } else {
            window.showErrorMessage(
                l10n.t("{0}/{1} members could not be converted!", total - converted, total),
                l10n.t("Show Conversion Report")
            ).then(openReport);
        }
    }

}
