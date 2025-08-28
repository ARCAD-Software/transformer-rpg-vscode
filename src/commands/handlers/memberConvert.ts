import { Uri, window } from "vscode";
import { Code4i } from "../../platform/ibmi/code4i";
import { BrowserItem, IBMiMember, MemberItem, ObjectItem } from "@halcyontech/vscode-ibmi-types";
import { MESSAGES } from "../../utils/constants";
import { validateSourceType } from "../../utils/helper";
import { openConfigWindow } from "./openConfigWindow";
import { getObjectType } from "../../platform/api";
import { ConversionTarget } from "../../models/conversionTarget";


type ConversionActionTarget = (BrowserItem & (ObjectItem | MemberItem));

export async function handleMemberConvert(item: ConversionActionTarget | Uri): Promise<void> {
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
                conversionTarget: {
                    library: item.object.library,
                    file: item.object.name,
                    filter: {
                        type: item.filter.filterType,
                        members: item.filter.member,
                        extensions: item.filter.memberType
                    }
                },
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