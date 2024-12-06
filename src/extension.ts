import { BrowserItem, IBMiMember, MemberItem, ObjectItem } from "@halcyontech/vscode-ibmi-types";
import { ExtensionContext, OutputChannel, Uri, commands, l10n, window, workspace } from "vscode";
import { Code4i } from "./code4i";
import { initializeConfiguration } from "./configuration";
import { getObjectType } from "./main/api";
import { addMembersToConversionList, openConfigWindow } from "./main/controller";
import { ConversionTarget } from "./main/model";
import { ExplorerNode } from "./main/views/common";
import { ConversionItemNode, ConversionListNode, ConversionListProvider } from "./main/views/conversionListBrowser";
import { ProductStatusDataProvider } from "./main/views/productStatus";
import { initializeProduct } from "./product";
import { COMMANDS, MESSAGES } from "./utils/constants";
import { validateSourceType } from "./utils/helper";

type ConversionActionTarget = (BrowserItem & (ObjectItem | MemberItem));

const NodeContext = {
  MEMBER: 'member',
  SPF: 'spf'
} as const;

let output: OutputChannel;
export function tfrrpgOutput() {
  if (output) {
    return output;
  }
  else {
    throw new Error(l10n.t("ARCAD-Transformer RPG is not active"));
  }
}

export function activate(context: ExtensionContext): void {
  Code4i.initialize(context);
  initializeExtension(context);
  console.log(MESSAGES.ACTIVATED);

  output = window.createOutputChannel("ARCAD-Transformer RPG", { log: true });
  output.clear();
  context.subscriptions.push(output);
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

async function handleMemberConvert(item: ConversionActionTarget | Uri): Promise<void> {
  if (!item || item instanceof Uri) {
    const conversionTarget = await getConversionTargetFromEditor();
    if (conversionTarget) {
      openConfigWindow({ conversionTarget });
    }
  } else {
    const parentnode = item.parent;
    if ("object" in item) {
      //Converting members from a source file
      openConfigWindow({
        conversionTarget: { library: item.object.library, file: item.object.name, filter: { type: item.filter.filterType, members: item.filter.member, extensions: item.filter.memberType } },
        parentnode
      });
    }
    else {
      const conversionTarget = await getConverionTarget(item.member);
      if (conversionTarget) {
        openConfigWindow({
          conversionTarget,
          parentnode
        });
      }
    }
  }
}


async function getConversionTargetFromEditor(): Promise<ConversionTarget | undefined> {
  const editor = window.activeTextEditor;
  if (editor) {
    const member = Code4i.getConnection().parserMemberPath(editor.document.uri.path);
    if (member) {
      return { library: member.library, file: member.file, member: member.name, extension: member.extension, objectType: await getObjectType(member.library, member.name) };
    }
  }
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
    commands.registerCommand("tfrrpg-product-view-description", (description: string) => {
      productView.description = description;
    }),
    workspace.onDidChangeConfiguration(change => {
      if (['arcad.connection.instance', "arcad-transformer-rpg.forceUseOfStandaloneProduct"].some(conf => change.affectsConfiguration(conf))) {
        productContentProvider.refresh();
      }
    })
  );
}

export function refreshListExplorer(node?: ExplorerNode): void {
  commands.executeCommand(COMMANDS.REFRESH_LIST, node);
}

async function getConverionTarget(member: IBMiMember): Promise<ConversionTarget | undefined> {
  try {
    if (validateSourceType(member.extension)) {
      return { library: member.library, file: member.file, member: member.name, extension: member.extension, objectType: await getObjectType(member.library, member.name) };
    }
    else {
      window.showErrorMessage(MESSAGES.UNSUPPORTED_SOURCE_TYPE, { modal: true });
    }
  } catch (error) {
    window.showErrorMessage(MESSAGES.MEMBER_INFO_FAILED);
  }
  return undefined;
}

export function getARCADInstance() {
  return workspace.getConfiguration('arcad').get<string>('connection.instance', 'AD');
}