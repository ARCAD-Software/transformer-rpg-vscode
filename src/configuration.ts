import { workspace, ConfigurationTarget } from 'vscode';

export interface CommandParams {
    SRCLIB: string;
    SRCMBR: string;
    SRCTYPE: string;
    SRCFILE: string;
    OBJTYPE: string;
    CVTCLCSPEC: string;
    CVTDCLSPEC: string;
    EXPCSPECPY: string;
    FULLYFREE: string;
    MAXNOTFREE: string;
    FIRSTCOL: number;
    USEPARMNUM: string;
    TOSRCFILE: string;
    TOSRCMBR: string;
    TOSRCLIB: string;
    REPLACE: string;
    CVT_CALL: string;
    CVT_GOTO: string;
    TAGFLDNAME: string;
    CVT_KLIST: string;
    CVT_MOVEA: string;
    INDENT: number;
    INDENTCMT: string;
    OPCODECASE: string;
    BLTFNCCASE: string;
    SPCWRDCASE: string;
    KEYWRDCASE: string;
    FLGCVTTYPE: string;
    CLRXREF: string;
    CLRFRMCHG: string;
    PRECPL: string;
    SRCDATE: string;
    CVT_SUBR: string;
    CHECKIND: string;
    SCANIND: string;
    LOOKUPIND: string;
    NUMTRUNCZ: string;
    NUMTRUNCA: string;
    NUMTRUNCB: string;
    NUMTRUNCM: string;
    NUMTRUNCD: string;
    EMPTYCMT: string;
    ALPHTONUM: string;
    KEEPDSIND: string;
}


export class ConfigManager {
    static getConfiguration() {
        return workspace.getConfiguration('arcad-transformer-rpg');
    }

    static getParams(): CommandParams | undefined {
        const params = this.getConfiguration().get<CommandParams>('command');
        return params;
    }

    static setParams(params: CommandParams) {
        return this.getConfiguration().update('command', params, ConfigurationTarget.Global);
    }

    
}
