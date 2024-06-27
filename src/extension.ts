import vscode from "vscode";
import { Code4i } from "./code4i";
import { openShowConfigWindow } from "./editor/configuration-panel";
import {  MemberItem } from "@halcyontech/vscode-ibmi-types";


export async function activate(context: vscode.ExtensionContext) {
	Code4i.initialize();
	context.subscriptions.push(
		vscode.commands.registerCommand("arcad-transformer-rpg.convertToFullyFree", async (node: MemberItem) => {
			openShowConfigWindow(node);
		})
	);
	console.log("ARCAD-Transformer RPG activated");
}

export function deactivate() {
	console.log("ARCAD-Transformer RPG deactivated");
}
