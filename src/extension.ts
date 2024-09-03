import { ExtensionContext, commands, window, l10n, TextEditor, ProgressLocation } from "vscode";
import { Code4i } from "./code4i";
import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { FilterType } from "@halcyontech/vscode-ibmi-types/api/Filter";
import { openConfigWindow } from "./editor/controller";
import { MemberItem } from "./editor/model";

const supportedSourceTypes = ['RPGLE', 'SQLRPGLE', 'RPG', 'RPG38', 'RPT', 'RPT38', 'SQLRPG'];

enum NodeContext {
	MEMBER = 'member',
	SPF = 'spf'
}

export async function activate(context: ExtensionContext) {
	Code4i.initialize();
	context.subscriptions.push(
		commands.registerCommand("arcad-tfrrpg-convert", async (node?: MemberItem) => {
			const editor = window.activeTextEditor;
			const member = getMemberinfo(node, editor);
			if (member) {
				openConfigWindow({
					massconvt: node?.contextValue.toLowerCase() === NodeContext.SPF,
					member,
					parentnode: node?.parent,
					getMembers(): Promise<IBMiMember[]> {
						if (node) {
							return getMembersList(node);
						} else {
							return Promise.resolve([]);
						}
					},
				});
			} 
		})
	);
	console.log("ARCAD-Transformer RPG activated");
}

function validateSourceType(sourceType: string): boolean {
	return supportedSourceTypes.includes(sourceType.toUpperCase());
}

async function getMembersList(node: MemberItem): Promise<IBMiMember[]> {
	return window.withProgress({
		location: ProgressLocation.Notification,
		title: 'Getting Members List',
		cancellable: false
	}, async () => {
		try {
			return await Code4i.getContent().getMemberList({
				library: node.object.library,
				sourceFile: node.object.name,
				members: node.filter.member,
				extensions: node.filter.memberType,
				filterType: node.filter.filterType as FilterType,
				sort: node.sort
			}).then(filterMembers);
		} catch (error) {
			console.error("Error fetching members list:", error);
			window.showErrorMessage("Failed to fetch members list. Please check your connection or configuration.");
			return [];
		}
	});
}

function getMemberinfo(node: MemberItem | undefined, editor: TextEditor | undefined): IBMiMember | undefined {
	try {
		if (node) {
			if (node.contextValue === NodeContext.MEMBER && node.member) {
				if(node.member.extension && !validateSourceType(node.member.extension)) {
					showUnsupportedSourceTypeError();
					return undefined;
				}
				return node.member;
			}

			if (node.contextValue.toLowerCase() === NodeContext.SPF) {
				const member: IBMiMember = {
					library: node.object.library,
					extension: node.object.attribute || '',
					file: node.object.type || '',
					name: node.object.name,
				};
				return member;
			}
		}

		if (editor) {
			return Code4i.getConnection().parserMemberPath(editor.document.uri.path);
		}
	} catch (error) {
		console.error("Error getting member info:", error);
		window.showErrorMessage("Failed to retrieve member information. Please ensure the file path and context are correct.");
	}

	return undefined;
}

export function deactivate() {
	console.log("ARCAD-Transformer RPG deactivated");
}

function showUnsupportedSourceTypeError(): void {
	window.showErrorMessage(
		l10n.t("This Source Type is not supported. Only {0} are supported.", supportedSourceTypes.join(', ')), { modal: true }
	);
}

function filterMembers(members: IBMiMember[]): IBMiMember[] {
	return members.filter(member => validateSourceType(member.extension));
}
