import { l10n, Uri, window } from "vscode";
import { Code4i } from "../../platform/ibmi/code4i";
import { MESSAGES } from "../../utils/constants";
import { getSourceMembersList, validateSourceType } from "../../utils/helper";
import { getObjectType } from "../../platform/api";
import { SourceMember } from "../../models/conversionTarget";
import { openConfigWindow } from "./openConfigWindow";
import { ConfigManager } from "../../config/configuration";
import type { BrowserItem, ObjectItem, MemberItem, IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { MemberConversionService } from "../../services/memberConversionService";

type ConversionActionTarget = (BrowserItem & (ObjectItem | MemberItem));

export async function handleMemberConvert(item: ConversionActionTarget | Uri): Promise<void> {
    switch (true) {
        case !item || item instanceof Uri: {
            await convertMemberFromEditor();
            break;
        }
        case "object" in (item as ObjectItem): {
            await convertMultipleMemberFromSourceFile(item as ObjectItem);
            break;
        }
        default: {
            await convertSingleMember(item as MemberItem & { parent: BrowserItem });
            break;
        }
    }
}

async function convertMemberFromEditor() {
    const member = await getConversionTargetFromEditor();
    if (member) {
        const param = await openConfigWindow({ member });
        if (param) {
            const report = await MemberConversionService.convertSingle(param, member);
            if (report?.result && report.target) {
                const path = `${param.TOSRCLIB}/${param.TOSRCFILE}/${report.target.name}.${report.target.extension}`;
                Code4i.open(path, { readonly: true });
            }
        }
    }
}

async function convertSingleMember(item: MemberItem & { parent: BrowserItem }) {
    const conversionTarget = await getConversionTarget(item.member);
    if (!conversionTarget) { return; }

    const commandParams = await openConfigWindow({ member: item.member, parentnode: item.parent });
    if (!commandParams) { return; }

    if (commandParams.buttons === 'convertnsave') {
        ConfigManager.setParams(commandParams);
    }

    const report = await MemberConversionService.convertSingle(commandParams, conversionTarget, item.parent);
    if (report?.result && report.target) {
        const path = `${report.target.library}/${report.target.file}/${report.target.name}.${report.target.extension}`;
        Code4i.open(path, { readonly: true });
    }
}

async function convertMultipleMemberFromSourceFile(item: ObjectItem) {
    const config = getWindowConfig(item);

    const commandParams = await openConfigWindow(config);
    if (!commandParams) { return; }

    const members = await getSourceMembersList({ library: item.object.library, sourceFile: item.object.name });
    if (members.length === 0) {
        window.showInformationMessage(l10n.t("No members found to convert"));
        return;
    }

    const confirmed = await confirmConversion(members);
    if (!confirmed) { return; }

    await MemberConversionService.convertMultiple(commandParams, members, true, config.member.library);
}


async function confirmConversion(members: SourceMember[]): Promise<boolean> {
    const preview = members
        .slice(0, 10)
        .map(member => `- ${member.name}`)
        .join('\n');

    const detail = `${preview}${members.length > 10
        ? l10n.t(`\n- {0} more...`, members.length - 10)
        : ''}`;

    const confirmation = await window.showWarningMessage(
        l10n.t(`Do you confirm the conversion of {0} members?`, members.length),
        { modal: true, detail },
        l10n.t("Yes"),
    );

    return Boolean(confirmation);
}

function getWindowConfig(item: ObjectItem) {
    return {
        member: {
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
