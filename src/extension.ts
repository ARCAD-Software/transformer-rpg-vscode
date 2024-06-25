import vscode from "vscode";
import { Code4i } from "./code4i";
import { openShowConfigWindow } from "./editor/configuration-panel";

export interface BrowseNode {
	member: Member
}

export interface Member {
	library: string
	file: string
	name: string
	extension: string
	recordLength: number
	text: string
	lines: number
	created: string
	changed: string
}

export async function activate(context: vscode.ExtensionContext) {
	Code4i.initialize();
	context.subscriptions.push(
		vscode.commands.registerCommand("arcad-transformer-rpg.convertToFullyFree", async (node: BrowseNode) => {
			openShowConfigWindow(node.member);
		})
	);
	console.log("ARCAD-Transformer RPG activated");
}

export function deactivate() {
	console.log("ARCAD-Transformer RPG deactivated");
}
