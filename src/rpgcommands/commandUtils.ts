import { Member } from '../extension';
import { CommandParams, commandParams } from './commandParams';

export function updateCommandParam<K extends keyof CommandParams>(key: K, value: CommandParams[K]) {
    commandParams[key] = value;
}

export function generateCommand(data: CommandParams, source: Member): string {
    const convertBool = (value: string): string => value ? '*YES' : '*NO';

    return `ARCAD_RPG/ACVTRPGFRE SRCFILE(${source.library}/${source.file}) SRCMBR(${source.name}) SRCTYPE(${source.extension}) ` +
        `OBJTYPE(${data.OBJTYPE}) CVTCLCSPEC(*NO) CVTDCLSPEC(*NO) ` +
        `EXPCSPECPY(${convertBool(data.EXPCSPECPY)}) FULLYFREE(*YES) ` +
        `MAXNOTFREE(${data.MAXNOTFREE}) FIRSTCOL(${data.FIRSTCOL}) USEPARMNUM(${convertBool(data.USEPARMNUM)}) ` +
        `TOSRCFILE(${data.TOSRCFILE}) TOSRCMBR(*FROMMBR) REPLACE(${convertBool(data.REPLACE)}) ` +
        `CVT_CALL(${convertBool(data.CVT_CALL)}) CVT_GOTO(${data.CVT_GOTO}) TAGFLDNAME('${data.TAGFLDNAME}') ` +
        `CVT_KLIST(${convertBool(data.CVT_KLIST)}) CVT_MOVEA(${data.CVT_MOVEA}) INDENT(${data.INDENT}) ` +
        `INDENTCMT(${convertBool(data.INDENTCMT)}) OPCODECASE(${data.OPCODECASE}) BLTFNCCASE(${data.BLTFNCCASE}) ` +
        `SPCWRDCASE(${data.SPCWRDCASE}) KEYWRDCASE(${data.KEYWRDCASE}) FLGCVTTYPE(${data.FLGCVTTYPE}) ` +
        `CLRXREF(${convertBool(data.CLRXREF)}) CLRFRMCHG(${convertBool(data.CLRFRMCHG)}) PRECPL(${data.PRECPL}) ` +
        `SRCDATE(${data.SRCDATE}) CVT_SUBR(*NO) CHECKIND(${data.CHECKIND}) SCANIND(${data.SCANIND}) LOOKUPIND(${data.LOOKUPIND}) ` +
        `NUMTRUNCZ(${data.NUMTRUNCZ}) NUMTRUNCA(${data.NUMTRUNCA}) NUMTRUNCB(${data.NUMTRUNCB}) ` +
        `NUMTRUNCM(${data.NUMTRUNCM}) NUMTRUNCD(${data.NUMTRUNCD}) EMPTYCMT(${data.EMPTYCMT}) ` +
        `ALPHTONUM(${data.ALPHTONUM}) KEEPDSIND(${data.KEEPDSIND})`;
}

export function executeCommand(command: string) {
    console.log("Executing command:", command);
}


