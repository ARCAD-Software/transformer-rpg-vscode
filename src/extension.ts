import { ExtensionContext, OutputChannel, commands, l10n, window, workspace } from "vscode";
import { Code4i } from "./platform/ibmi/code4i";
import { initializeProduct } from "./product";
import { COMMANDS, MESSAGES } from "./utils/constants";
import { ConfigManager } from "./config/configuration";
import { ConversionListProvider } from "./ui/tree/conversion/provider";
import { ExplorerNode } from "./ui/tree/common/explorerNode";
import { ProductStatusDataProvider } from "./ui/tree/productstatus/productStatusProvider";
import { registerCommands } from "./commands/registerCommands";


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
  ConfigManager.initializeConfiguration(context);
  registerCommands(context, initializeTreeViews(context));
  initializeProduct(context);
}

function initializeTreeViews(context: ExtensionContext) {
  const conversionProvider = new ConversionListProvider();

  const conversionListView = window.createTreeView('arcad-tfrrpg-conversion-list', {
    treeDataProvider: conversionProvider,
    showCollapseAll: true,
    canSelectMany: true,
  });

  const productProvider = new ProductStatusDataProvider(context);
  const productView = window.createTreeView('arcad-tfrrpg-product-status', {
    treeDataProvider: productProvider,
    showCollapseAll: true
  });

  context.subscriptions.push(conversionListView, productView);
  return { conversionProvider, productProvider, productView };
}

export function refreshListExplorer(node?: ExplorerNode): void {
  commands.executeCommand(COMMANDS.REFRESH_LIST, node);
}


export function getARCADInstance() {
  return workspace.getConfiguration('arcad').get<string>('connection.instance', 'AD');
}