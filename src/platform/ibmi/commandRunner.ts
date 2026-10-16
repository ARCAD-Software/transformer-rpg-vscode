import type { CommandResult } from "@halcyontech/vscode-ibmi-types";
import { l10n, window } from "vscode";
import { tfrrpgOutput } from "../../utils/output";
import { product } from "../../product/product";
import { convertBool } from "../../utils/helper";
import { Code4i } from "./code4i";
import { CommandParams } from "../../models/commandParams";
import { SourceMember } from "../../models/sourceMember";

/** MAXNOTFREE accepts *NONE or 1-999; anything else falls back to *NONE. */
function toMaxNotFree(value: string): string {
    const text = String(value ?? "").trim().toUpperCase();
    return /^[1-9]\d{0,2}$/.test(text) ? text : "*NONE";
}

export async function generateCommand(data: CommandParams, source: SourceMember) {
    const getToSrcFile = () => data.TOSRCFILE === '*FROMFILE' ? data.TOSRCFILE : `${data.TOSRCLIB}/${data.TOSRCFILE}`;
    return `${await product.getProductLibrary()}/ACVTRPGFRE SRCFILE(${source.library}/${source.file}) SRCMBR(${source.name}) SRCTYPE(${source.extension}) ` +
        `OBJTYPE(${data.OBJTYPE || source.objectType || '*NONE'}) CVTCLCSPEC(${data.CVTCLCSPEC}) CVTDCLSPEC(${convertBool(data.CVTDCLSPEC)}) ` +
        `EXPCSPECPY(${convertBool(data.EXPCSPECPY)}) FULLYFREE(${data.FULLYFREE}) ` +
        `MAXNOTFREE(${toMaxNotFree(data.MAXNOTFREE)}) FIRSTCOL(${data.FIRSTCOL}) USEPARMNUM(${convertBool(data.USEPARMNUM)}) ` +
        `TOSRCFILE(${getToSrcFile()}) TOSRCMBR(${data.TOSRCMBR || source.name || "*FROMMBR"}) REPLACE(${convertBool(data.REPLACE)}) ` +
        `CVT_CALL(${convertBool(data.CVT_CALL)}) CVT_GOTO(${data.CVT_GOTO}) TAGFLDNAME('${data.TAGFLDNAME}') ` +
        `CVT_KLIST(${convertBool(data.CVT_KLIST)}) CVT_MOVEA(${data.CVT_MOVEA}) INDENT(${data.INDENT}) ` +
        `INDENTCMT(${convertBool(data.INDENTCMT)}) OPCODECASE(${data.OPCODECASE}) BLTFNCCASE(${data.BLTFNCCASE}) ` +
        `SPCWRDCASE(${data.SPCWRDCASE}) KEYWRDCASE(${data.KEYWRDCASE}) FLGCVTTYPE(${data.FLGCVTTYPE}) ` +
        `CLRXREF(${convertBool(data.CLRXREF)}) CLRFRMCHG(${convertBool(data.CLRFRMCHG)}) PRECPL(${data.PRECPL}) ` +
        `SRCDATE(${data.SRCDATE}) CVT_SUBR(${data.CVT_SUBR}) CHECKIND(${data.CHECKIND}) SCANIND(${data.SCANIND}) LOOKUPIND(${data.LOOKUPIND}) ` +
        `NUMTRUNCZ(${data.NUMTRUNCZ}) NUMTRUNCA(${data.NUMTRUNCA}) NUMTRUNCB(${data.NUMTRUNCB}) ` +
        `NUMTRUNCM(${data.NUMTRUNCM}) NUMTRUNCD(${data.NUMTRUNCD}) EMPTYCMT(${data.EMPTYCMT}) ` +
        `ALPHTONUM(${data.ALPHTONUM}) KEEPDSIND(${data.KEEPDSIND})`;
}


export async function executeConversionCommand(command: string): Promise<CommandResult | undefined> {
    try {
        return await Code4i.getConnection().runCommand({ command, environment: "ile" });
    } catch (error: any) {
        tfrrpgOutput().appendLine(l10n.t('Error executing conversion command: {0}', JSON.stringify(error)));
        window.showErrorMessage(l10n.t('Error executing conversion command'), l10n.t("Open output"));
    }
}