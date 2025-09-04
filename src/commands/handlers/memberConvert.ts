import { Uri, window } from "vscode";
import { Code4i } from "../../platform/ibmi/code4i";
import { MESSAGES } from "../../utils/constants";
import { validateSourceType } from "../../utils/helper";
import { getObjectType } from "../../platform/api";
import { SourceMember } from "../../models/conversionTarget";
import { openConfigWindow, ConversionConfiguration } from "./openConfigWindow";
import { convertMultipleMembers } from "../../services/conversionBatchService";
import { ConfigManager } from "../../config/configuration";
import { handleConversion } from "../../services/conversionService";
import type { BrowserItem, ObjectItem, MemberItem, IBMiMember } from "@halcyontech/vscode-ibmi-types";

type ConversionActionTarget = (BrowserItem & (ObjectItem | MemberItem));

export async function handleMemberConvert(item: ConversionActionTarget | Uri): Promise<void> {
    switch (true) {
        // Case 1: Fired from Editor
        case !item || item instanceof Uri: {
            await convertMemberFromEditor();
            break;
        }

        // Case 2: Multiple Members (Source File Selected) 
        case "object" in (item as ObjectItem): {
            const config = getWindowConfig(item as ObjectItem);
            const commandParams = await openConfigWindow(config);
            if (commandParams) {
                await convertMultipleMembers(commandParams, config.conversionTarget);
            }
            break;
        }

        // Case 3: Single Item
        default: {
            const memberItem = item as MemberItem & { parent: BrowserItem };
            const conversionTarget = await getConversionTarget(memberItem.member);
            if (conversionTarget) {
                const commandParameters = await openConfigWindow({ conversionTarget, parentnode: memberItem.parent });
                if (commandParameters) {
                    if (commandParameters.buttons === 'convertnsave') {
                        ConfigManager.setParams(commandParameters);
                    }
                    handleConversion(commandParameters, conversionTarget, memberItem.parent);
                }
            }
            break;
        }
    }
}

async function convertMemberFromEditor() {
    const conversionTarget = await getConversionTargetFromEditor();
    if (conversionTarget) {
        openConfigWindow({ conversionTarget });
    }
}

function getWindowConfig(item: ObjectItem): ConversionConfiguration {
    return {
        conversionTarget: {
            file: item.object.name,
            library: item.object.library,
        } as SourceMember
    };
}

async function getConversionTargetFromEditor(): Promise<SourceMember | undefined> {
    const editor = window.activeTextEditor;
    if (editor) {
        const member = Code4i.getConnection().parserMemberPath(editor.document.uri.path);
        if (member) {
            return {
                ...member,
                objectType: await getObjectType(member.library, member.name)
            };
        }
    }
}

async function getConversionTarget(member: IBMiMember): Promise<SourceMember | undefined> {
    try {
        if (validateSourceType(member.extension)) {
            return {
                ...member,
                objectType: await getObjectType(member.library, member.name)
            };
        } else {
            window.showErrorMessage(MESSAGES.UNSUPPORTED_SOURCE_TYPE, { modal: true });
        }
    } catch (error) {
        window.showErrorMessage(MESSAGES.MEMBER_INFO_FAILED);
    }
    return undefined;
}
