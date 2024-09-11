import { ExtensionContext, commands, window, l10n, TextEditor, ProgressLocation } from "vscode";
import { Code4i } from "./code4i";
import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { FilterType } from "@halcyontech/vscode-ibmi-types/api/Filter";
import { addMembersToConversionList, openConfigWindow } from "./main/controller";
import { ConversionListProvider, ConversionListNode, ExplorerNode, ConversionItemNode, BaseConversionNode } from "./main/views/conversionListBrowser";
import { IMemberItem } from "./main/model";

const SUPPORTED_SOURCE_TYPES = new Set(['RPGLE', 'SQLRPGLE', 'RPG', 'RPG38', 'RPT', 'RPT38', 'SQLRPG']);
const NodeContext = {
  MEMBER: 'member',
  SPF: 'spf'
} as const;

const COMMANDS = {
  MEMBER_CONVERT: 'tfrrpg-member-convert',
  NEW_CONVERSION_LIST: 'tfrrpg-list-create',
  ADD_MEMBER: 'tfrrpg-list-add',
  ADD_MULTIPLE_MEMBERS: 'tfrrpg-list-add-multiple',
  REFRESH_LIST: 'tfrrpg-list-refresh',
  DELETE_LIST: 'tfrrpg-list-delete',
  REFRESH_OBJECT_BROWSER: 'code-for-ibmi.refreshObjectBrowser',
  DELETE_LIST_ITEM: 'tfrrpg-list-item-delete',
  UPDATE_OBJECT_TYPE: 'tfrrpg-list-item-update-objtype'
};

export function activate(context: ExtensionContext): void {
  Code4i.initialize();
  Code4i.onEvent('connected', () => {
    initializeExtension(context);
    console.log("Connected to HalcyonTech server. ARCAD-Transformer RPG initialized.");
  });
  console.log("ARCAD-Transformer RPG activated. Waiting for connection to HalcyonTech server...");
}

export function deactivate(): void {
  console.log("ARCAD-Transformer RPG deactivated");
}

function initializeExtension(context: ExtensionContext): void {
  initializeTreeView(context);
  registerCommands(context);
}

// Register all commands for the extension
function registerCommands(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand(COMMANDS.MEMBER_CONVERT, handleMemberConvert),
    commands.registerCommand(COMMANDS.ADD_MEMBER, addMembersToConversionList),
    commands.registerCommand(COMMANDS.ADD_MULTIPLE_MEMBERS, handleAddMultipleMembers),
  );
}

// Handle member conversion command
async function handleMemberConvert(node: IMemberItem): Promise<void> {
  const editor = window.activeTextEditor;
  const member = getMemberInfo(node, editor);
  if (member) {
    launchSourceConversion(node, member);
  }
}

// Launch the source conversion process
function launchSourceConversion(node: IMemberItem, member: IBMiMember): void {
  openConfigWindow({
    massconvt: node.contextValue?.toLowerCase() === NodeContext.SPF,
    member,
    parentnode: node.parent,
    getMembers: () => getMembersList(node)
  });
}

// Initialize the TreeView for the extension
function initializeTreeView(context: ExtensionContext): void {
  const contentProvider = new ConversionListProvider();
  const objectTreeViewer = window.createTreeView(`arcad-tfrrpg-conversion-list`, {
    treeDataProvider: contentProvider,
    showCollapseAll: true,
    canSelectMany: true,
  });

  context.subscriptions.push(
    objectTreeViewer,
    commands.registerCommand(COMMANDS.REFRESH_LIST, () => contentProvider.refresh()),
    commands.registerCommand(COMMANDS.NEW_CONVERSION_LIST, () => contentProvider.addNewConversionList()),
    commands.registerCommand(COMMANDS.DELETE_LIST, (node: ConversionListNode) => node.deleteConversionList(node)),
    commands.registerCommand(COMMANDS.DELETE_LIST_ITEM, (node: ConversionItemNode) => node.removeMemberFromList(node)),
    commands.registerCommand(COMMANDS.UPDATE_OBJECT_TYPE, (node: ConversionItemNode | ConversionListNode) => { node.updateMemberObjectType(); }),

  );
}

export function refreshListExplorer(node?: ExplorerNode): void {
  commands.executeCommand(COMMANDS.REFRESH_LIST, node);
}

export function refreshIbmIExplorer(node?: any): void {
  commands.executeCommand(COMMANDS.REFRESH_OBJECT_BROWSER, node || '');
}

function validateSourceType(sourceType: string): boolean {
  return SUPPORTED_SOURCE_TYPES.has(sourceType.toUpperCase());
}

async function getMembersList(node: IMemberItem): Promise<IBMiMember[]> {
  return window.withProgress({
    location: ProgressLocation.Notification,
    title: l10n.t("Fetching members list..."),
    cancellable: false
  }, async () => {
    try {
      const members = await Code4i.getContent().getMemberList({
        library: node.object.library,
        sourceFile: node.object.name,
        members: node.filter.member,
        extensions: node.filter.memberType,
        filterType: node.filter.filterType as FilterType,
        sort: node.sort
      });
      return filterMembers(members);
    } catch (error) {
      window.showErrorMessage(l10n.t("Failed to fetch members list. Please check your connection or configuration."));
      return [];
    }
  });
}

// Filter members based on supported source types
function filterMembers(members: IBMiMember[]): IBMiMember[] {
  return members.filter(member => validateSourceType(member.extension));
}

function getMemberInfo(node: IMemberItem | undefined, editor: TextEditor | undefined): IBMiMember | undefined {
  try {
    if (editor) {
      return Code4i.getConnection().parserMemberPath(editor.document.uri.path);
    }
    if (node) {
      if (node.contextValue === NodeContext.MEMBER && node.member) {
        if (!validateSourceType(node.member.extension)) {
          showUnsupportedSourceTypeError();
          return undefined;
        }
        return node.member;
      }
      if (node.contextValue.toLowerCase() === NodeContext.SPF) {
        return {
          library: node.object.library,
          extension: node.object.attribute || '',
          file: node.object.type || '',
          name: node.object.name,
        };
      }
    }
  } catch (error) {
    window.showErrorMessage(l10n.t("Failed to retrieve member information. Please ensure the file path and context are correct."));
  }
  return undefined;
}

function showUnsupportedSourceTypeError(): void {
  window.showErrorMessage(
    l10n.t("This Source Type is not supported. Only {0} are supported.", Array.from(SUPPORTED_SOURCE_TYPES).join(', ')),
    { modal: true }
  );
}

async function handleAddMultipleMembers(node: IMemberItem): Promise<void> {
  const members = await getMembersList(node);
  if (members.length === 0) {
    window.showErrorMessage(l10n.t("No members found in the source file. Please check your configuration."));
    return;
  }

  addMembersToConversionList(members);
}



