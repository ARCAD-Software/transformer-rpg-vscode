import { l10n } from "vscode";

export const SUPPORTED_SOURCE_TYPES = ['RPGLE', 'SQLRPGLE', 'RPG', 'RPG38', 'RPT', 'RPT38', 'SQLRPG'];

export const COMMANDS = {
  MEMBER_CONVERT: 'tfrrpg-member-convert',
  NEW_CONVERSION_LIST: 'tfrrpg-list-create',
  ADD_MEMBER: 'tfrrpg-list-add',
  ADD_MULTIPLE_MEMBERS: 'tfrrpg-list-add-multiple',
  REFRESH_LIST: 'tfrrpg-list-refresh',
  DELETE_LIST: 'tfrrpg-list-delete',
  DELETE_LIST_ITEM: 'tfrrpg-list-item-delete',
  EDIT_LIST_PROPERTIES: 'tfrrpg-list-edit-properties',
  UPDATE_OBJECT_TYPE: 'tfrrpg-list-item-update-objtype',
  CONVERT_TARGET_MEMBER: 'tfrrpg-list-item-member-convert',
  EDIT_SOURCE: 'tfrrpg-list-item-source-edit',
  EDIT_CONVERTED_SOURCE: 'tfrrpg-list-item-converted-source-edit',
  FOCUS_OBJECT_BROWSER: 'tfrrpg-list-objectbrowser.focus',
  VIEW_PRODUCT_DESCRIPTION: 'tfrrpg-product-view-description'
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

