import { CodeForIBMi, IBMiEvent, OpenEditableOptions } from "@halcyontech/vscode-ibmi-types";
import IBMiContent from "@halcyontech/vscode-ibmi-types/api/IBMiContent";
import vscode from "vscode";
import { TransformerRPGLicense } from "./components/TFRRPGLIC";

let codeForIBMi: CodeForIBMi;
export namespace Code4i {
  export async function initialize(context: vscode.ExtensionContext) {
    const codeForIBMiExtension = vscode.extensions.getExtension<CodeForIBMi>('halcyontechltd.code-for-ibmi');
    if (codeForIBMiExtension) {
      codeForIBMi = codeForIBMiExtension.isActive ? codeForIBMiExtension.exports : await codeForIBMiExtension.activate();
      codeForIBMi.componentRegistry.registerComponent(context, new TransformerRPGLicense());
    }
    else {
      throw new Error(vscode.l10n.t("The extension 'ARCAD Transformer RPG' requires the 'halcyontechltd.code-for-ibmi' extension to be active!"));
    }
  }

  export function getConnection() {
    return codeForIBMi.instance.getConnection();
  }

  export function subscribe(context: vscode.ExtensionContext, name: string, event: IBMiEvent, todo: Function) {
    codeForIBMi.instance.subscribe(context, event, name, todo);
  }

  export function getContent(): IBMiContent {
    return codeForIBMi.instance.getContent();
  }

  export function customUI() {
    return codeForIBMi.customUI();
  }

  export function getTools() {
    return codeForIBMi.tools;
  }

  export function open(path: string, options?: OpenEditableOptions) {
    vscode.commands.executeCommand("code-for-ibmi.openEditable", path, options);
  }
}