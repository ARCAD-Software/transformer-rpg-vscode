import type { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { window, ProgressLocation, l10n } from "vscode";
import { Code4i } from "../platform/ibmi/code4i";
import { MESSAGES, SUPPORTED_SOURCE_TYPES } from "../utils/constants";
import { tfrrpgOutput } from "../utils/output";

export type MemberListParam = {
  library: string;
  sourceFile: string;
};

export function validateSourceType(sourceType: string): boolean {
    return SUPPORTED_SOURCE_TYPES.includes(sourceType.toUpperCase());
}

export function filterMembers(member: IBMiMember) {
    return validateSourceType(member.extension);
}

export async function listConvertibleMembers(param: MemberListParam): Promise<IBMiMember[]> {
  return (await Code4i.getContent().getMemberList(param)).filter(filterMembers);
}

export async function getSourceMembersList(param: MemberListParam): Promise<IBMiMember[]> {
    return window.withProgress({
        location: ProgressLocation.Notification,
        title: MESSAGES.FETCHING_MEMBERS,
        cancellable: false
    }, async () => {
        try {
            return listConvertibleMembers(param);
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
