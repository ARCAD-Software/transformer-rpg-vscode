import vscode from "vscode";
import { Code4i } from "./code4i";

export async function activate(context: vscode.ExtensionContext) {
	Code4i.initialize();
	context.subscriptions.push(		
		
	);
	console.log("ARCAD-Transformer RPG activated");
}

export function deactivate() { 
	console.log("ARCAD-Transformer RPG deactivated");
}
