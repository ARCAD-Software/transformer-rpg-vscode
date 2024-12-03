import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { ExtensionContext, ProgressLocation, Uri, commands, window, workspace } from "vscode";
import { Code4i } from "./code4i";
import { initializeConfiguration } from "./configuration";
import { addMembersToConversionList, openConfigWindow } from "./main/controller";
import { MemberNode } from "./main/model";
import { ConversionItemNode, ConversionListNode, ConversionListProvider, ExplorerNode } from "./main/views/conversionListBrowser";
import { ProductStatusDataProvider } from "./main/views/productStatus";
import { initializeProduct } from "./product";
import { COMMANDS, MESSAGES } from "./utils/constants";
import { filterMembers, validateSourceType } from "./utils/helper";

const NodeContext = {
  MEMBER: 'member',
  SPF: 'spf'
} as const;


export function activate(context: ExtensionContext): void {
  Code4i.initialize(context);
  initializeExtension(context);
  console.log(MESSAGES.ACTIVATED);
}

export function deactivate(): void {
  console.log(MESSAGES.DEACTIVATED);
}

function initializeExtension(context: ExtensionContext): void {
  initializeConfiguration();
  initializeTreeViews(context);
  registerCommands(context);
  initializeProduct(context);
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

function initializeTreeViews(context: ExtensionContext): void {
  const conversionContentProvider = new ConversionListProvider();
  const conversionListView = window.createTreeView(`arcad-tfrrpg-conversion-list`, {
    treeDataProvider: conversionContentProvider,
    showCollapseAll: true,
    canSelectMany: true,
  });

  const productContentProvider = new ProductStatusDataProvider(context);
  const productView = window.createTreeView("arcad-tfrrpg-product-status", {
    treeDataProvider: productContentProvider,
    showCollapseAll: true
  });

  context.subscriptions.push(
    conversionListView,
    productView,
    commands.registerCommand(COMMANDS.REFRESH_LIST, () => conversionContentProvider.refresh()),
    commands.registerCommand(COMMANDS.NEW_CONVERSION_LIST, () => conversionContentProvider.addNewConversionList()),
    commands.registerCommand(COMMANDS.DELETE_LIST, (node: ConversionListNode) => node.deleteConversionList(node)),
    commands.registerCommand(COMMANDS.DELETE_LIST_ITEM, (node: ConversionItemNode) => node.removeMemberFromList(node)),
    commands.registerCommand(COMMANDS.UPDATE_OBJECT_TYPE, (node: ConversionItemNode | ConversionListNode) => node.updateMemberObjectType()),
    commands.registerCommand(COMMANDS.EDIT_SOURCE, (node: ConversionItemNode) => { node.editMember(); }),
    commands.registerCommand(COMMANDS.EDIT_CONVERTED_SOURCE, (node: ConversionItemNode) => node.editConvertedMember()),
    commands.registerCommand(COMMANDS.FOCUS_OBJECT_BROWSER, (node: ConversionListNode) => node.openIBMiObjectBrowser()),
    commands.registerCommand(COMMANDS.CONVERT_TARGET_MEMBER, (node: ConversionItemNode | ConversionListNode) => {
      if (node instanceof ConversionItemNode) {
        node.startSingleItemConversion();
      } else {
        node.processBatchConversion();
      }
    }),
  );
}

export function refreshListExplorer(node?: ExplorerNode): void {
  commands.executeCommand(COMMANDS.REFRESH_LIST, node);
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

export function getARCADInstance() {
  return workspace.getConfiguration('arcad').get<string>('connection.instance', 'AD');
}