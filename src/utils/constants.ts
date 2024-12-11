import { l10n } from "vscode";
import { CommandParams } from "../main/model";

export const SUPPORTED_SOURCE_TYPES = ['RPGLE', 'SQLRPGLE', 'RPG', 'RPG38', 'RPT', 'RPT38', 'SQLRPG'];

export const COMMANDS = {
    MEMBER_CONVERT: 'tfrrpg-member-convert',
    NEW_CONVERSION_LIST: 'tfrrpg-list-create',
    ADD_MEMBER: 'tfrrpg-list-add',
    ADD_MULTIPLE_MEMBERS: 'tfrrpg-list-add-multiple',
    REFRESH_LIST: 'tfrrpg-list-refresh',
    DELETE_LIST: 'tfrrpg-list-delete',
    DELETE_LIST_ITEM: 'tfrrpg-list-item-delete',
    UPDATE_OBJECT_TYPE: 'tfrrpg-list-item-update-objtype',
    CONVERT_TARGET_MEMBER: 'tfrrpg-list-item-member-convert',
    EDIT_SOURCE: 'tfrrpg-list-item-source-edit',
    EDIT_CONVERTED_SOURCE: 'tfrrpg-list-item-converted-source-edit',
    FOCUS_OBJECT_BROWSER: 'tfrrpg-list-objectbrowser.focus'
  };
  
  export const MESSAGES = {
    ACTIVATED: l10n.t("ARCAD-Transformer RPG activated. Waiting for connection to IBM i server..."),
    DEACTIVATED: l10n.t("ARCAD-Transformer RPG deactivated"),
    FETCHING_MEMBERS: l10n.t("Fetching members list..."),
    FETCH_FAILED: l10n.t("Failed to fetch members list. Please check your connection or configuration."),
    MEMBER_INFO_FAILED: l10n.t("Failed to retrieve member information. Please ensure the file path and context are correct."),
    UNSUPPORTED_SOURCE_TYPE: l10n.t("This Source Type is not supported. Only {0} are supported.", Array.from(SUPPORTED_SOURCE_TYPES).join(', ')),
    NO_MEMBERS_FOUND: l10n.t("No members found in the source file. Please check your configuration.")
  };

  export const defaultConfig: CommandParams = {
    SRCLIB: "",
    SRCMBR: "",
    SRCTYPE: "",
    SRCFILE: "",
    CVTCLCSPEC: "*FREE",
    CVTDCLSPEC: "*YES",
    EXPCSPECPY: "*NO",
    FULLYFREE: "*YES",
    MAXNOTFREE: "*NONE",
    FIRSTCOL: 1,
    USEPARMNUM: "*NO",
    TOSRCFILE: "*NONE",
    TOSRCMBR: "*FROMMBR",
    TOSRCLIB: "",
    REPLACE: "*NO",
    CVT_CALL: "*YES",
    CVT_GOTO: "*ADVANCED",
    TAGFLDNAME: "ATag",
    CVT_KLIST: "*YES",
    CVT_MOVEA: "*ADVANCED",
    INDENT: 2,
    INDENTCMT: "*YES",
    OPCODECASE: "*MIXED",
    BLTFNCCASE: "*MIXED",
    SPCWRDCASE: "*MIXED",
    KEYWRDCASE: "*MIXED",
    FLGCVTTYPE: "*NO",
    CLRXREF: "*YES",
    CLRFRMCHG: "*YES",
    PRECPL: "*ARCAD",
    SRCDATE: "*CURRENT",
    CVT_SUBR: "*NO",
    CHECKIND: "*WNG1",
    SCANIND: "*WNG1",
    LOOKUPIND: "*WNG1",
    NUMTRUNCZ: "*YES",
    NUMTRUNCA: "*YES",
    NUMTRUNCB: "*NO",
    NUMTRUNCM: "*YES",
    NUMTRUNCD: "*YES",
    EMPTYCMT: "*KEEP",
    ALPHTONUM: "*YES",
    KEEPDSIND: "*NO"
};