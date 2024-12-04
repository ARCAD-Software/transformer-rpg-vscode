export enum ConversionStatus {
    NA = -1,
    SUCCEED = 0,
    WARNING = 1,
    FAILED = 2
}

const MSGID_SUCCEED1 = 'MSG3867';
const MSGID_SUCCEED2 = 'MSG3868';
const MSGID_SUCCEED3 = 'MSG4330';
const MSGID_SUCCEED4 = 'MSG4409';
const MSGID_WARNING1 = 'MSG4178';
const MSGID_WARNING2 = 'CPF9801';
const MSGID_WARNING3 = 'MSG4331';


export function getConversionStatus(status: number): string {
    switch (status) {
        case ConversionStatus.NA:
            return 'N/A';
        case ConversionStatus.SUCCEED:
            return 'Succeed';
        case ConversionStatus.WARNING:
            return 'Warning';
        case ConversionStatus.FAILED:
            return 'Failed';
        default:
            return 'Unknown';
    }
}

export function setConverionStatus(msg: string): ConversionStatus {
    if (msg.includes(MSGID_SUCCEED1) || msg.includes(MSGID_SUCCEED2) || msg.includes(MSGID_SUCCEED3) || msg.includes(MSGID_SUCCEED4)) {
        return ConversionStatus.SUCCEED;
    } else if (msg.includes(MSGID_WARNING1) || msg.includes(MSGID_WARNING2) || msg.includes(MSGID_WARNING3)) {
        return ConversionStatus.WARNING;
    } else {
        return ConversionStatus.FAILED;
    }
}

export function getStatusColorFromCode(status: number): string {
    let color = 'vscode-editor-foreground';

    switch (status) {
        case ConversionStatus.SUCCEED:
            color = 'testing.iconPassed';
            break;
        case ConversionStatus.WARNING:
            color = 'testing.iconQueued';
            break;
        case ConversionStatus.FAILED:
            color = 'testing.iconFailed';
            break;
    }

    return color;
}

export function getStatusColor(msg: string): string {
    let color = 'var(--vscode-editor-foreground)';

    if (msg.includes('MSG3867')) {
        color = 'var(--vscode-terminal-ansiGreen)';
    } else if (msg.includes('MSG3866') || msg.includes('MSG3540') || msg.includes('MSG3995')) {
        color = 'var(--vscode-editorError-foreground)';
    } else if (msg.includes('MSG4178') || msg.includes('CPF9801')) {
        color = 'var(--vscode-editorWarning-foreground)';
    }

    return color;
}


