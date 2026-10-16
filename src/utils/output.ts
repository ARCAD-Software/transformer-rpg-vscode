import { ExtensionContext, OutputChannel, l10n, window } from "vscode";

let output: OutputChannel;

export function initializeOutput(context: ExtensionContext): void {
  output = window.createOutputChannel("ARCAD-Transformer RPG", { log: true });
  output.clear();
  context.subscriptions.push(output);
}

export function tfrrpgOutput() {
  if (output) {
    return output;
  }
  else {
    throw new Error(l10n.t("ARCAD-Transformer RPG is not active"));
  }
}
