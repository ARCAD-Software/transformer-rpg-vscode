import { CommandParams } from '../configuration';
import { ConversionTarget } from '../main/model';
import { product } from '../product';
import { convertBool } from '../utils/helper';

export async function generateCommand(data: CommandParams, source: ConversionTarget) {
    const getToSrcFile = () => data.TOSRCFILE === '*FROMFILE' ? data.TOSRCFILE : `${data.TOSRCLIB}/${data.TOSRCFILE}`;
    return `${await product.getProductLibrary()}/ACVTRPGFRE SRCFILE(${source.library}/${source.file}) SRCMBR(${source.member}) SRCTYPE(${source.extension}) ` +
        `OBJTYPE(${data.OBJTYPE || source.objectType || '*NONE'}) CVTCLCSPEC(*FREE) CVTDCLSPEC(${convertBool(data.CVTDCLSPEC)}) ` +
        `EXPCSPECPY(${convertBool(data.EXPCSPECPY)}) FULLYFREE(*YES) ` +
        `MAXNOTFREE(${data.MAXNOTFREE}) FIRSTCOL(${data.FIRSTCOL}) USEPARMNUM(${convertBool(data.USEPARMNUM)}) ` +
        `TOSRCFILE(${getToSrcFile()}) TOSRCMBR(${data.TOSRCMBR || source.member || "*FROMMBR"}) REPLACE(${convertBool(data.REPLACE)}) ` +
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