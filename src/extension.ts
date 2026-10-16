import { ExtensionContext, window } from "vscode";
import { Code4i } from "./platform/ibmi/code4i";
import { initializeProduct } from "./product/product";
import { MESSAGES } from "./utils/constants";
import { initializeOutput } from "./utils/output";
import { ConfigManager } from "./config/configuration";
import { ConversionListProvider } from "./ui/tree/conversion/provider";
import { ProductStatusDataProvider } from "./ui/tree/productStatus/provider";
import { registerCommands } from "./commands/registerCommands";


export function activate(context: ExtensionContext): void {
  Code4i.initialize(context);
  initializeExtension(context);
  console.log(MESSAGES.ACTIVATED);

  initializeOutput(context);
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
