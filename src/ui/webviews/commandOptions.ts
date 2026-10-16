export function generateOptions(options: string[], selectedValue?: string) {
    return options.map((type) => {
        return { text: type, description: type, value: type, selected: type === "" ? false : type === selectedValue };
    });
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

export function getFirstColumnOptions() {
    return ['1', '2', '3', '4', '5'];
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

export function getCalculationSpecOptions() {
    return ['*FREE', '*CHECK', '*FREECHECK', '*NO', '*EXTFACT2'];
}

export function getIndicatorOptions() {
    return ['*WNG1', '*YES', '*NO'];
}

export function getAlphaToNumOptions() {
    return ['*WNG1', '*YES', '*NO'];
}

export function getTruncationOptions() {
    return ['*WNG1', '*WNG2', '*YES', '*NO'];
}
