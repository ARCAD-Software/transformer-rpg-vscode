import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { SUPPORTED_SOURCE_TYPES } from "./constants";

export function generateOptions(options: string[], selectedValue: string) {
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

export function getTruncationOptions() {
    return ['*WNG1', '*WNG2', '*YES', '*NO'];
}

export function validateSourceType(sourceType: string): boolean {
    return SUPPORTED_SOURCE_TYPES.includes(sourceType.toUpperCase());
}

export function filterMembers(members: IBMiMember[]): IBMiMember[] {
    return members.filter(member => validateSourceType(member.extension!));
}