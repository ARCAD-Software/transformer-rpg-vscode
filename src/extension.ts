import { ExtensionContext, commands, window, ProgressLocation, Uri } from "vscode";
import { Code4i } from "./code4i";
import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { addMembersToConversionList, openConfigWindow } from "./main/controller";
import { ConversionListProvider, ConversionListNode, ExplorerNode, ConversionItemNode } from "./main/views/conversionListBrowser";
import { MESSAGES, COMMANDS } from "./utils/constants";
import { filterMembers, validateSourceType } from "./utils/helper";
import { MemberNode } from "./main/model";

const NodeContext = {
  MEMBER: 'member',
  SPF: 'spf'
} as const;


export function activate(context: ExtensionContext): void {
  Code4i.initialize();
  initializeExtension(context);

  Code4i.onEvent('connected', () => {
    console.log(MESSAGES.CONNECTED);
  });
  console.log(MESSAGES.ACTIVATED);
}

export function deactivate(): void {
  console.log(MESSAGES.DEACTIVATED);
}

function initializeExtension(context: ExtensionContext): void {
  initializeTreeView(context);
  registerCommands(context);
}

function registerCommands(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand(COMMANDS.MEMBER_CONVERT, handleMemberConvert),
    commands.registerCommand(COMMANDS.ADD_MEMBER, addMembersToConversionList),
    commands.registerCommand(COMMANDS.ADD_MULTIPLE_MEMBERS, addMembersToConversionList),
  );
}

async function handleMemberConvert(item: MemberNode | Uri): Promise<void> {
  let member: IBMiMember | undefined;
  let isMassConverison = false;

  if ('contextValue' in item) {
    isMassConverison = item.contextValue.toLowerCase() === NodeContext.SPF;
    member = getMemberInfo(item);
    if (member) {
      launchSourceConversion(item, member, isMassConverison);
    }
  } else {
    member = await getMemberInfoFromEditor();
    if (member) {
      launchSourceConversion({} as MemberNode, member, false);
    }
  }
}


async function getMemberInfoFromEditor(): Promise<IBMiMember | undefined> {
  const editor = window.activeTextEditor;
  if (editor) {
    return Code4i.getConnection().parserMemberPath(editor.document.uri.path);
  }
}

function launchSourceConversion(node: MemberNode, member: IBMiMember, isMassConverison: boolean): void {
  openConfigWindow({
    massconvt: isMassConverison,
    member,
    parentnode: node.parent,
    getMembers: () => getMembersListWithProgress(node)
  });
}

function initializeTreeView(context: ExtensionContext): void {
  const contentProvider = new ConversionListProvider();
  const conversionListView = window.createTreeView(`arcad-tfrrpg-conversion-list`, {
    treeDataProvider: contentProvider,
    showCollapseAll: true,
    canSelectMany: true,
  });

  context.subscriptions.push(
    conversionListView,
    commands.registerCommand(COMMANDS.REFRESH_LIST, () => contentProvider.refresh()),
    commands.registerCommand(COMMANDS.NEW_CONVERSION_LIST, () => contentProvider.addNewConversionList()),
    commands.registerCommand(COMMANDS.DELETE_LIST, (node: ConversionListNode) => node.deleteConversionList(node)),
    commands.registerCommand(COMMANDS.DELETE_LIST_ITEM, (node: ConversionItemNode) => node.removeMemberFromList(node)),
    commands.registerCommand(COMMANDS.UPDATE_OBJECT_TYPE, (node: ConversionItemNode | ConversionListNode) => { node.updateMemberObjectType(); }),
    commands.registerCommand(COMMANDS.CONVERT_TARGET_MEMBER, (node: ConversionItemNode | ConversionListNode) => { node.initConversion(); }),
    commands.registerCommand(COMMANDS.EDIT_SOURCE, (node: ConversionItemNode) => { node.editMember(); }),
    commands.registerCommand(COMMANDS.EDIT_CONVERTED_SOURCE, (node: ConversionItemNode) => { node.editConvertedMember(); }),
    commands.registerCommand(COMMANDS.FOCUS_OBJECT_BROWSER, (node: ConversionListNode) => { node.openIBMiObjectBrowser(); }),
  );
}

export function refreshListExplorer(node?: ExplorerNode): void {
  commands.executeCommand(COMMANDS.REFRESH_LIST, node);
}

export function refreshIbmIExplorer(node?: any): void {
  commands.executeCommand(COMMANDS.REFRESH_OBJECT_BROWSER, node || '');
}


export async function getMembersListWithProgress(node: MemberNode): Promise<IBMiMember[]> {
  return window.withProgress({
    location: ProgressLocation.Notification,
    title: MESSAGES.FETCHING_MEMBERS,
    cancellable: false
  }, async () => {
    return fetchMembers(node);
  });
}

export async function getMembersListWithoutProgress(node: MemberNode): Promise<IBMiMember[]> {
  return fetchMembers(node);
}

async function fetchMembers(node: MemberNode): Promise<IBMiMember[]> {
  try {
    const members = await Code4i.getContent().getMemberList({
      library: node.object.library,
      sourceFile: node.object.name,
      members: node.filter.member,
      extensions: node.filter.memberType,
      sort: node.sort
    });
    return filterMembers(members);
  } catch (error) {
    window.showErrorMessage(MESSAGES.FETCH_FAILED);
    return [];
  }
}


function getMemberInfo(node: MemberNode | undefined): IBMiMember | undefined {
  try {
    if (node) {
      if (node.contextValue === NodeContext.MEMBER && node.member) {
        if (!validateSourceType(node.member.extension!)) {
          showUnsupportedSourceTypeError();
          return undefined;
        }
        return node.member;
      }
      if (node.contextValue.toLowerCase() === NodeContext.SPF) {
        return {
          library: node.object.library,
          file: node.object.name,
          name: '*ALL',
        };
      }
    }
  } catch (error) {
    window.showErrorMessage(MESSAGES.MEMBER_INFO_FAILED);
  }
  return undefined;
}

function showUnsupportedSourceTypeError(): void {
  window.showErrorMessage(MESSAGES.UNSUPPORTED_SOURCE_TYPE, { modal: true });
}


