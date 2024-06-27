import { ComplexTab, CustomUI } from "@halcyontech/vscode-ibmi-types/api/CustomUI";
import { commands, l10n, ProgressLocation, window } from "vscode";
import { generateOptions, getConvertOptions, getIndentSizeOptions, getEmptyCommentLinesOptions, getCaseOptions, getWarningOptions, getBooleanOptions, getSourceLineDate, getBooleanOptionsWithKeep, getTruncationOptions, getPrecompilationOptions, getObjectTypes } from "./utilities";
import { generateCommand } from "../rpgcommands/commandUtils";
import { IBMiMember, MemberItem } from "@halcyontech/vscode-ibmi-types";
import { CommandParams, ConfigManager } from "../configuration";
import { Code4i } from "../code4i";

const supportedSourceTypes = ['RPGLE', 'SQLRPGLE', 'RPG', 'RPG38', 'RPT', 'RPT38', 'SQLRPG'];
export const convertBool = (value: string): string => value ? '*YES' : '*NO';

export async function openShowConfigWindow(node: MemberItem): Promise<void> {
    const member = node.member;
    if (!validateSourceType(member.extension)) {
        window.showErrorMessage(
            `This Source Type is not supported. Only ${supportedSourceTypes.join(', ')} are supported.`, { modal: true }
        );
        return;
    }
    const config = ConfigManager.getParams();
    if (!config) { return; };

    const tabs = createTabs(member, config);
    const tabwindow = Code4i.customUI().addComplexTabs(tabs)
        .addHorizontalRule()
        .addButtons({ id: "convert", label: l10n.t("Convert") })
        .addButtons({ id: "convertnsave", label: l10n.t("Convert and Save Config") });

    const page = await tabwindow.loadPage<any>(l10n.t("ARCAD-Transformer RPG: {0}", member.name));

    if (page && page.data) {
        page.panel.dispose();
        const commandParams = page.data as CommandParams;
        if (page.data.buttons === 'convertnsave') {
            ConfigManager.setParams(commandParams);
        }
        const command = generateCommand(commandParams, member);
        await executeConversionCommand(command);
        await commands.executeCommand('code-for-ibmi.refreshObjectBrowser', (node as any).parent);
    }

    async function executeConversionCommand(command: string): Promise<void> {
        try {
            window.withProgress({
                location: ProgressLocation.Notification,
                title: l10n.t("Converting Source Member to Fully Free Format..."),
                cancellable: false
            }, async () => {
                const executionResult = await Code4i.getConnection().runCommand({ command });
                const message = Code4i.getTools().parseMessages(executionResult.stderr);
                if (executionResult.code === 0) {
                    window.showInformationMessage(executionResult.stdout, { modal: true });
                } else {
                    window.showErrorMessage(executionResult.stderr);
                }
                console.log(message);
            });

        } catch (error) {
            window.showErrorMessage(`Error executing conversion command: ${error}`);
        }
    }

    function createTabs(member: IBMiMember, config: CommandParams): ComplexTab[] {
        return [
            { label: l10n.t("Properties"), fields: createPropertiesUI(member, config).fields },
            { label: l10n.t("Conversion Options"), fields: createConversionOptions(config).fields },
            { label: l10n.t("Advanced Conversion Options"), fields: createAdvancedOptions(config).fields }
        ];
    }

    function createPropertiesUI(member: IBMiMember, config: CommandParams): CustomUI {
        return Code4i.customUI()
            .addHeading(l10n.t("Converted Source Member Properties"), 3)
            .addParagraph(createPropertiesTable(member))
            .addSelect("OBJTYPE", l10n.t("Object Type"), generateOptions(getObjectTypes(), config.OBJTYPE))
            .addHorizontalRule()
            .addParagraph('Convert Calculation Specs : <code>*FREE</code>')
            .addParagraph('Convert Declaration Specs : <code>*YES</code>')
            .addHorizontalRule()
            .addHeading(l10n.t("Target Source Member Information"), 4)
            .addInput("TOSRCLIB", l10n.t("Library"), "", { default: member.library, readonly: false })
            .addInput("TOSRCFILE", l10n.t("Source File"), "<code>*NONE</code>: No output | <code>*FROMFILE</code>: Same destination | Specify member name for converted source", { default: config.TOSRCFILE, readonly: false })
            .addInput("TOSRCMBR", l10n.t("Source Member"), "<code>*FROMFILE</code>: Same destination | Specify member name for converted source", { default: config.TOSRCMBR, readonly: false })
            .addHorizontalRule()
            .addCheckbox("REPLACE", l10n.t("Replace Existing Member"), l10n.t("Replace the source member with the converted source"), convertBool(config.REPLACE) === "*YES")
            .addCheckbox("EXPCSPECPY", l10n.t("Expand Copy Book with C-Spec"), l10n.t("Expand Copy Books with C-Spec"), convertBool(config.EXPCSPECPY) === "*YES");
    }

    function createConversionOptions(config: CommandParams): CustomUI {
        return Code4i.customUI()
            .addHeading(l10n.t("Conversion Options"), 3)
            .addParagraph('FULLYFREE : <code>*YES</code>')
            .addInput("MAXNOTFREE", l10n.t("Max number of blocks not free"), "", { default: config.MAXNOTFREE, readonly: true })
            .addInput("FIRSTCOL", l10n.t("First Column (fully free)"), "", { default: config.FIRSTCOL.toString(), readonly: true })
            .addHorizontalRule()
            .addCheckbox("CVT_CALL", l10n.t("Convert Program calls"), "", convertBool(config.CVT_CALL) === "*YES")
            .addSelect("CVT_GOTO", l10n.t("Convert Goto"), generateOptions(getConvertOptions(), config.CVT_GOTO))
            .addInput("TAGFLDNAME", l10n.t("Goto Label"), "", { default: config.TAGFLDNAME })
            .addCheckbox("CVT_KLIST", l10n.t("Convert Key List"), "", convertBool(config.CVT_KLIST) === "*YES")
            .addSelect("CVT_MOVEA", l10n.t("Convert MOVEA"), generateOptions(getConvertOptions(), config.CVT_MOVEA))
            .addParagraph('Convert Subr. to Procedure : <code>*NO</code>')
            .addCheckbox("USEPARMNUM", l10n.t("Use %ParmNum"), "", convertBool(config.USEPARMNUM) === "*YES")
            .addSelect("INDENT", l10n.t("Indentation Size (char)"), generateOptions(getIndentSizeOptions(), config.INDENT.toString()))
            .addCheckbox("INDENTCMT", l10n.t("Indent Comments"), "", convertBool(config.INDENTCMT) === "*YES")
            .addSelect("EMPTYCMT", l10n.t("Empty Comment Lines"), generateOptions(getEmptyCommentLinesOptions(), config.EMPTYCMT))
            .addSelect("OPCODECASE", l10n.t("Case for operation codes"), generateOptions(getCaseOptions(), config.OPCODECASE))
            .addSelect("BLTFNCCASE", l10n.t("Case for the B.i.F."), generateOptions(getCaseOptions(), config.BLTFNCCASE))
            .addSelect("SPCWRDCASE", l10n.t("Case for special words"), generateOptions(getCaseOptions(), config.SPCWRDCASE))
            .addSelect("KEYWRDCASE", l10n.t("Case for key words"), generateOptions(getCaseOptions(), config.KEYWRDCASE));
    }

    function createAdvancedOptions(config: CommandParams): CustomUI {
        return Code4i.customUI()
            .addHeading(l10n.t("Advanced Options"), 3)
            .addSelect("KEEPDSIND", l10n.t("Keep indentation in the DS:"), generateOptions(getWarningOptions(), config.KEEPDSIND))
            .addSelect("ALPHTONUM", l10n.t("Analyze Alpha to num. MOVE:"), generateOptions(getBooleanOptions(), config.ALPHTONUM))
            .addSelect("PRECPL", l10n.t("Precompilation Clauses:"), generateOptions(getPrecompilationOptions(), ""))
            .addSelect("SRCDATE", l10n.t("Source Line Date:"), generateOptions(getSourceLineDate(), config.SRCDATE))
            .addSelect("FLGCVTTYPE", l10n.t("Mark the conversion type:"), generateOptions(getBooleanOptionsWithKeep(), config.FLGCVTTYPE))
            .addCheckbox("CLRXREF", l10n.t("Clean Temporary Cross-reference:"), "", convertBool(config.CLRXREF) === "*YES")
            .addCheckbox("CLRFRMCHG", l10n.t("Clean Modified Lines:"), "", convertBool(config.CLRFRMCHG) === "*YES")
            .addHorizontalRule()
            .addHeading(l10n.t("Analyze Indicator Problems"), 4)
            .addSelect("CHECKIND", l10n.t("CHECK:"), generateOptions(getWarningOptions(), config.CHECKIND))
            .addSelect("SCANIND", l10n.t("SCAN:"), generateOptions(getWarningOptions(), config.SCANIND))
            .addSelect("LOOKUPIND", l10n.t("LOOKUP:"), generateOptions(getWarningOptions(), config.LOOKUPIND))
            .addHorizontalRule()
            .addHeading(l10n.t("Analyze Numeric Truncation"), 4)
            .addSelect("NUMTRUNCZ", l10n.t("Z-ADD, Z-SUB:"), generateOptions(getTruncationOptions(), config.NUMTRUNCZ))
            .addSelect("NUMTRUNCA", l10n.t("ADD, SUB {Length(Fact1/Fact2)>Length(Result)}:"), generateOptions(getTruncationOptions(), config.NUMTRUNCA))
            .addSelect("NUMTRUNCB", l10n.t("ADD, SUB {Other}:"), generateOptions(getTruncationOptions(), config.NUMTRUNCB))
            .addSelect("NUMTRUNCM", l10n.t("MULT:"), generateOptions(getTruncationOptions(), config.NUMTRUNCM))
            .addSelect("NUMTRUNCD", l10n.t("DIV:"), generateOptions(getTruncationOptions(), config.NUMTRUNCD));
    }

    function createPropertiesTable(member: IBMiMember): string {
        return `<table>
            ${addRow(l10n.t("Source Library"), member.library)}
            ${addRow(l10n.t("Source File"), member.file)}
            ${addRow(l10n.t("Source Member"), member.name)}
            ${addRow(l10n.t("Source Type"), member.extension)}
        </table>`;
    }

    function addRow(key: string, value?: any): string {
        if (value !== undefined) {
            return /*html*/ `<tr>
                <td><vscode-label>${key}:</vscode-label></td>
                <td>${value}</td>
            </tr>`;
        } else {
            return `<tr> 
                <td colspan="2"><h3><u>${key}</u></h3></td>
            </tr>`;
        }
    }

    function validateSourceType(sourceType: string): boolean {
        return supportedSourceTypes.includes(sourceType.toUpperCase());
    }
}
