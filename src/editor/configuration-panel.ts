import { ComplexTab, CustomUI } from "@halcyontech/vscode-ibmi-types/api/CustomUI";
import { Code4i } from "../code4i";
import { Member } from "../extension";
import { l10n, window } from "vscode";
import { CommandParams, commandParams } from "../rpgcommands/commandParams";
import { generateOptions, getSourceFiles, getConvertOptions, getIndentSizeOptions, getEmptyCommentLinesOptions, getCaseOptions, getWarningOptions, getBooleanOptions, getSourceLineDate, getBooleanOptionsWithKeep, getTruncationOptions, getPrecompilationOptions } from "./utilities";
import { generateCommand } from "../rpgcommands/commandUtils";

const supportedSourceTypes = ['RPGLE', 'SQLRPGLE', 'RPG', 'RPG38', 'RPT', 'RPT38', 'SQLRPG'];

export async function openShowConfigWindow(source: Member) {
    if (!validateSourceType(source.extension)) {
        window.showErrorMessage(
            `This Source Type is not supported. Only ${supportedSourceTypes.join(', ')} are supported.`, { modal: true }
        );
        return;
    }
    const properties = createPropertiesUI(source);
    const conversionOptions = createConversionOptions();
    const advancedOptions = createAdvancedOptions();
    const tabs: ComplexTab[] = [
        { label: l10n.t("Properties"), fields: properties.fields },
        { label: l10n.t("Conversion Options"), fields: conversionOptions.fields },
        { label: l10n.t("Advanced Conversion Options"), fields: advancedOptions.fields }
    ];

    const page = await Code4i.customUI().addComplexTabs(tabs).loadPage(l10n.t("ARCAD-Transformer RPG: {0}", source.name));

    if (page && page.data) {
        const command = generateCommand(page.data as CommandParams , source);
        console.log(command);

        page.panel.dispose();
        window.showInformationMessage(command, {
            modal: true
        });

    }
}

function createPropertiesUI(source: Member): CustomUI {
    const ui = Code4i.customUI()
        .addHeading(l10n.t("Converted Source Member Properties"), 3)
        .addParagraph(createPropertiesTable(source))
        .addInput("OBJTYPE", l10n.t("Object Type"), "", { default: "*NONE", readonly: true })
        .addHorizontalRule()
        .addParagraph('Convert Calculation Specs : <code>*NO</code>')
        .addParagraph('Convert Declaration Specs : <code>*NO</code>')
        .addHorizontalRule()
        .addInput("SRCLIB", l10n.t("Library"), "", { default: source.library, readonly: false })
        .addSelect("TOSRCFILE", l10n.t("Source File"), generateOptions(getSourceFiles(), commandParams.TOSRCFILE))
        .addSelect("SRCMBR", l10n.t("Source Member"), generateOptions(getSourceFiles().slice(1), commandParams.TOSRCMBR))
        .addHorizontalRule()
        .addCheckbox("REPLACE", l10n.t("Replace Existing Member"), l10n.t("Replace the source member with the converted source"), commandParams.REPLACE === "*YES")
        .addCheckbox("EXPCSPECPY", l10n.t("Expand Copy Book with C-Spec"), l10n.t("Expand Copy Books with C-Spec"), commandParams.EXPCSPECPY === "*YES")
        .addHorizontalRule()
        .addButtons({ id: "convert", label: l10n.t("Convert") });
    return ui;
}


function createConversionOptions(): CustomUI {
    const ui = Code4i.customUI()
        .addHeading(l10n.t("Conversion Options"), 3)
        // .addCheckbox("FULLYFREE", l10n.t('Convert to "Fully Free"'), "", commandParams.FULLYFREE === "*YES")
        .addParagraph('FULLYFREE : <code>*YES</code>')
        .addInput("MAXNOTFREE", l10n.t("Max number of blocks not free"), "", { default: commandParams.MAXNOTFREE, readonly: true })
        .addInput("FIRSTCOL", l10n.t("First Column (fully free)"), "", { default: commandParams.FIRSTCOL.toString(), readonly: true })
        .addHorizontalRule()
        .addCheckbox("CVT_CALL", l10n.t("Convert Program calls"), "", commandParams.CVT_CALL === "*YES")
        .addSelect("CVT_GOTO", l10n.t("Convert Goto"), generateOptions(getConvertOptions(), commandParams.CVT_GOTO))
        .addInput("TAGFLDNAME", l10n.t("Goto Label"), "", { default: commandParams.TAGFLDNAME })
        .addCheckbox("CVT_KLIST", l10n.t("Convert Key List"), "", commandParams.CVT_KLIST === "*YES")
        .addSelect("CVT_MOVEA", l10n.t("Convert MOVEA"), generateOptions(getConvertOptions(), commandParams.CVT_MOVEA))
        .addParagraph('Convert Subr. to Procedure : <code>*NO</code>')
        .addCheckbox("USEPARMNUM", l10n.t("Use %ParmNum"), "", commandParams.USEPARMNUM === "*YES")
        .addSelect("INDENT", l10n.t("Indentation Size (char)"), generateOptions(getIndentSizeOptions(), commandParams.INDENT.toString()))
        .addCheckbox("INDENTCMT", l10n.t("Indent Comments"), "", commandParams.INDENTCMT === "*YES")
        .addSelect("EMPTYCMT", l10n.t("Empty Comment Lines"), generateOptions(getEmptyCommentLinesOptions(), commandParams.EMPTYCMT))
        .addSelect("OPCODECASE", l10n.t("Case for operation codes"), generateOptions(getCaseOptions(), commandParams.OPCODECASE))
        .addSelect("BLTFNCCASE", l10n.t("Case for the B.i.F."), generateOptions(getCaseOptions(), commandParams.BLTFNCCASE))
        .addSelect("SPCWRDCASE", l10n.t("Case for special words"), generateOptions(getCaseOptions(), commandParams.SPCWRDCASE))
        .addSelect("KEYWRDCASE", l10n.t("Case for key words"), generateOptions(getCaseOptions(), commandParams.KEYWRDCASE))
        .addButtons({ id: "convert", label: l10n.t("Convert") });
    return ui;
}

function createAdvancedOptions(): CustomUI {
    const ui = Code4i.customUI()
        .addHeading(l10n.t("Advanced Options"), 3)
        .addSelect("KEEPDSIND", l10n.t("Keep indentation in the DS:"), generateOptions(getWarningOptions(), commandParams.KEEPDSIND))
        .addSelect("ALPHTONUM", l10n.t("Analyze Alpha to num. MOVE:"), generateOptions(getBooleanOptions(), commandParams.ALPHTONUM))
        .addSelect("PRECPL", l10n.t("Precompilation Clauses:"), generateOptions(getPrecompilationOptions(),""))
        .addSelect("SRCDATE", l10n.t("Source Line Date:"), generateOptions(getSourceLineDate(), commandParams.SRCDATE))
        .addSelect("FLGCVTTYPE", l10n.t("Mark the conversion type:"), generateOptions(getBooleanOptionsWithKeep(), commandParams.FLGCVTTYPE))
        .addCheckbox("CLRXREF", l10n.t("Clean Temporary Cross-reference:"), "", commandParams.CLRXREF === "*YES")
        .addCheckbox("CLRFRMCHG", l10n.t("Clean Modified Lines:"), "", commandParams.CLRFRMCHG === "*YES")
        .addHorizontalRule()
        .addHeading(l10n.t("Analyze Indicator Problems"), 4)
        .addSelect("CHECKIND", l10n.t("CHECK:"), generateOptions(getWarningOptions(), commandParams.CHECKIND))
        .addSelect("SCANIND", l10n.t("SCAN:"), generateOptions(getWarningOptions(), commandParams.SCANIND))
        .addSelect("LOOKUPIND", l10n.t("LOOKUP:"), generateOptions(getWarningOptions(), commandParams.LOOKUPIND))
        .addHorizontalRule()
        .addHeading(l10n.t("Analyze Numeric Truncation"), 4)
        .addSelect("NUMTRUNCZ", l10n.t("Z-ADD, Z-SUB:"), generateOptions(getTruncationOptions(), commandParams.NUMTRUNCZ))
        .addSelect("NUMTRUNCA", l10n.t("ADD, SUB {Length(Fact1/Fact2)>Length(Result)}:"), generateOptions(getTruncationOptions(), commandParams.NUMTRUNCA))
        .addSelect("NUMTRUNCB", l10n.t("ADD, SUB {Other}:"), generateOptions(getTruncationOptions(), commandParams.NUMTRUNCB))
        .addSelect("NUMTRUNCM", l10n.t("MULT:"), generateOptions(getTruncationOptions(), commandParams.NUMTRUNCM))
        .addSelect("NUMTRUNCD", l10n.t("DIV:"), generateOptions(getTruncationOptions(), commandParams.NUMTRUNCD))
        .addButtons({ id: "convert", label: l10n.t("Convert") });
    return ui;
}

function createPropertiesTable(source: Member): string {
    return `<table>
        ${addRow(l10n.t("SRCLIB"), source.library)}
        ${addRow(l10n.t("Source File"), source.file)}
        ${addRow(l10n.t("SRCMBR"), source.name)}
        ${addRow(l10n.t("SRCTYPE"), source.extension)}
    </table>`;
}

function validateSourceType(sourceType: string): boolean {
    return supportedSourceTypes.includes(sourceType.toUpperCase());
}

// Helper function to add a row to the properties table
function addRow(key: string, value?: any) {
    if (value !== undefined) {
        return /*html*/ `<tr>
            <td><vscode-label>${key}:</vscode-label></td>
            <td>${value}</td>
        </tr>`;
    } else {
        return /*html*/ `<tr>
            <td colspan="2"><h3><u>${key}</u></h3></td>
        </tr>`;
    }
}
