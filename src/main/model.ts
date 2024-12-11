import { FilterType } from "@halcyontech/vscode-ibmi-types/api/Filter";

interface Connection {
    name: string;
    host: string;
    port: number;
    username: string;
}

export type Connections = Connection[];

export type ConversionTarget = {
    library: string
    file: string
    member?: string
    extension?: string
    objectType?: string
    filter?: {
        members?: string
        extensions?: string
        type: FilterType
    }
};

export interface CommandParams {
    CVTCLCSPEC: string;
    CVTDCLSPEC: string;
    EXPCSPECPY: string;
    FULLYFREE: string;
    MAXNOTFREE: string;
    FIRSTCOL: number;
    USEPARMNUM: string;
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
    buttons?: string;
    SRCLIB?: string;
    SRCMBR?: string;
    SRCTYPE?: string;
    SRCFILE?: string;
    OBJTYPE?: string;
    TOSRCLIB?: string;
    TOSRCFILE?: string
    TOSRCMBR?: string;
}