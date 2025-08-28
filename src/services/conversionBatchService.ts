import { l10n, ProgressLocation, window } from "vscode";
import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { tfrrpgOutput } from "../extension";
import { MESSAGES } from "../utils/constants";
import { listConvertibleMembers } from "./objectDiscoveryService";
import { findObjectType } from "../platform/api";
import { convertTargets } from "./conversionExecutionService";
import { CommandParams } from "../models/command";
import { ConversionTarget } from "../models/conversionTarget";

export async function convertMultipleMembers(data: CommandParams, conversionTarget: ConversionTarget): Promise<void> {
    const sourceMembersList: ConversionTarget[] = (await getMembersListWithProgress(conversionTarget))
        .map(member => ({ library: member.library, file: member.file, member: member.name, extension: member.extension }));
    if (sourceMembersList.length) {
        const memberNames = sourceMembersList
            .slice(0, 10)
            .map(member => `- ${member.member}`)
            .join('\n');

        const detail = `${memberNames}${sourceMembersList.length > 10 ? l10n.t(`\n- {0} more...`, sourceMembersList.length - 10) : ''}`;
        const isConfirmtoConvert = await window.showWarningMessage(
            l10n.t(`Do you confirm the conversion of {0} members?`, sourceMembersList.length),
            { modal: true, detail },
            l10n.t("Yes"),
        );
        if (isConfirmtoConvert) {
            await lookupMemberObjectTypes(sourceMembersList, conversionTarget.library);
            await convertTargets(data, sourceMembersList, conversionTarget.library);
        }
    }
    else {
        window.showInformationMessage(l10n.t("No members found to convert"));
        return;
    }
}

export async function getMembersListWithProgress(target: ConversionTarget): Promise<IBMiMember[]> {
    return window.withProgress({
        location: ProgressLocation.Notification,
        title: MESSAGES.FETCHING_MEMBERS,
        cancellable: false
    }, async () => {
        try {
            return listConvertibleMembers(target);
        } catch (error) {
            tfrrpgOutput().appendLine(l10n.t("Failed to fetch members list: {0}", JSON.stringify(error)));
            window.showErrorMessage(MESSAGES.FETCH_FAILED, l10n.t("Open output"))
                .then(open => {
                    if (open) {
                        tfrrpgOutput().show();
                    }
                });
            return [];
        }
    });
}

export async function lookupMemberObjectTypes(targets: ConversionTarget[], library: string) {
    await window.withProgress({
        location: ProgressLocation.Notification,
        title: l10n.t("Looking up members' object types"),
        cancellable: true
    }, async (progress, token) => {
        const cache = new Map;
        const increment = 100 / targets.length;
        let current = 1;
        for (const target of targets) {
            if (token.isCancellationRequested) {
                return;
            }

            if (target.member) {
                target.objectType = await findObjectType(library, target.member, cache);
                progress.report({ increment, message: `${current++}/${targets.length}` });
            }
        }
    });
}
