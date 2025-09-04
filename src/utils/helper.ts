import type { IBMiMember, IBMiMessage } from "@halcyontech/vscode-ibmi-types";
import { MESSAGES, SUPPORTED_SOURCE_TYPES } from "./constants";
import { window, ProgressLocation, l10n } from "vscode";
import { tfrrpgOutput } from "../extension";
import { SourceMember } from "../models/conversionTarget";
import { listConvertibleMembers, MemberListParam } from "../services/objectDiscoveryService";

export function generateOptions(options: string[], selectedValue?: string) {
    return options.map((type) => {
        return { text: type, description: type, value: type, selected: type === "" ? false : type === selectedValue };
    });
}

export function convertBool(value: string): string {
    return value ? '*YES' : '*NO';
}

export function getPrecompilationOptions() {
    return ['*ARCAD', '*ALDON'];
}

export function getIndentSizeOptions() {
    return ['0', '1', '2', '3', '4', '5'];
}

export function getConvertOptions() {
    return ['*NO', '*BASE', '*ADVANCED'];
}

export function getEmptyCommentLinesOptions() {
    return ['*KEEP', '*BLANK', '*ONELINE', '*REMOVE'];
}

export function getCaseOptions() {
    return ['*UPPER', '*LOWER', '*MIXED'];
}

export function getObjectTypes() {
    return ['*PGM', '*MODULE'];
}

export function getSourceLineDate() {
    return ['*ZERO', '*CURRENT', '*KEEP'];
}
export function getSourceFiles() {
    return ['*NONE', '*FROMFILE'];
}
export function getBooleanOptions() {
    return ['*NO', '*YES'];
}
export function getBooleanOptionsWithKeep() {
    return ['*NO', '*YES', '*KEEP'];
}
export function getWarningOptions() {
    return ['*YES', '*NO'];
}

export function getAlphaToNumOptions() {
    return ['*WNG1', '*YES', '*NO'];
}

export function getTruncationOptions() {
    return ['*WNG1', '*WNG2', '*YES', '*NO'];
}

export function validateSourceType(sourceType: string): boolean {
    return SUPPORTED_SOURCE_TYPES.includes(sourceType.toUpperCase());
}

export function filterMembers(member: IBMiMember) {
    return validateSourceType(member.extension);
}

export function filterConversionMessage(message: IBMiMessage) {
    return !["MSG3565", "CPC0904", "CPD4090"].includes(message.id);
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