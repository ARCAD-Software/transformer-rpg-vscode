import { ComplexTab, CustomUI } from "@halcyontech/vscode-ibmi-types/api/CustomUI";
import { l10n } from "vscode";
import { Code4i } from "../../code4i";
import { convertBool, filterConversionMessage, generateOptions, getAlphaToNumOptions, getBooleanOptionsWithKeep, getCaseOptions, getConvertOptions, getEmptyCommentLinesOptions, getIndentSizeOptions, getObjectTypes, getPrecompilationOptions, getSourceLineDate, getTruncationOptions, getWarningOptions } from "../../utils/helper";
import { ExecutionReport } from "../controller";
import { getStatusColor } from "../conversionMessage";
import { CommandParams, ConversionTarget } from "../model";

export function createTabs(member: ConversionTarget, config: CommandParams): ComplexTab[] {
    return [
        { label: l10n.t("Properties"), fields: createPropertiesUI(member, config).fields },
        { label: l10n.t("Conversion Options"), fields: createConversionOptions(config).fields },
        { label: l10n.t("Advanced Conversion Options"), fields: createAdvancedOptions(config).fields }
    ];
}

export function createTargetLibTabs(config: CommandParams): ComplexTab[] {
    return [
        { label: l10n.t("Conversion Options"), fields: createConversionOptions(config, true).fields },
        { label: l10n.t("Advanced Conversion Options"), fields: createAdvancedOptions(config).fields }
    ];
}

export function setupTabWindow(tabs: ComplexTab[], multiple: boolean): CustomUI {
    return Code4i.customUI()
        .addHeading(multiple ? l10n.t("Multiple Members Conversion") : l10n.t("Single Member Conversion"), 2)
        .addComplexTabs(tabs)
        .addHorizontalRule()
        .addButtons({ id: "convert", label: l10n.t("Convert") })
        .addButtons({ id: "convertnsave", label: l10n.t("Convert and Save Config") });
}


// Properties Tab
function createPropertiesUI(conversion: ConversionTarget, config: CommandParams): CustomUI {
    const ui = Code4i.customUI();
    ui.addHeading(l10n.t("Converted Source Member Properties"), 3)
        .addParagraph(createPropertiesTable(conversion));

    if (conversion.member) {
        ui.addSelect("OBJTYPE", l10n.t("Object Type"), generateOptions([...getObjectTypes(), "*NONE"], conversion.objectType));
    }

    ui.addHorizontalRule()
        .addParagraph(l10n.t('Convert Calculation Specs : <code>*FREE</code>'))
        .addCheckbox("CVTDCLSPEC", l10n.t("Convert Declaration Specs"), l10n.t("Convert Declaration Specs"), convertBool(config.CVTDCLSPEC) === "*YES")
        .addHorizontalRule()
        .addHeading(l10n.t("Target Source Member Information"), 4)
        .addInput("TOSRCLIB", l10n.t("Library"), "", { default: conversion.library })
        .addInput("TOSRCFILE", l10n.t("Source File"), l10n.t("<code>*NONE</code>: No output | <code>*FROMFILE</code>: Same destination | Specify source file name for converted source"), { default: conversion.file, readonly: false });

    if (conversion.member) {
        ui.addInput("TOSRCMBR", l10n.t("Source Member"), l10n.t("<code>*FROMMBR</code>: Same member name | Specify member name for converted source"), { default: "*FROMMBR" });
    }

    ui.addHorizontalRule()
        .addCheckbox("REPLACE", l10n.t("Replace Existing Member"), l10n.t("Replace the source member with the converted source"), convertBool(config.REPLACE) === "*YES")
        .addCheckbox("EXPCSPECPY", l10n.t("Expand Copy Book with C-Spec"), l10n.t("Expand Copy Books with C-Spec"), convertBool(config.EXPCSPECPY) === "*YES");

    return ui;
}

// Conversion Options Tab
function createConversionOptions(config: CommandParams, targetConversion = false): CustomUI {
    const ui = Code4i.customUI()
        .addHeading(l10n.t("Conversion Options"), 3);

    if (targetConversion) {
        ui.addCheckbox("REPLACE", l10n.t("Replace Existing Member"), l10n.t("Replace the source member with the converted source"), convertBool(config.REPLACE) === "*YES")
            .addCheckbox("EXPCSPECPY", l10n.t("Expand Copy Book with C-Spec"), l10n.t("Expand Copy Books with C-Spec"), convertBool(config.EXPCSPECPY) === "*YES")
            .addCheckbox("CVTDCLSPEC", l10n.t("Convert Declaration Specs"), l10n.t("Convert Declaration Specs"), convertBool(config.CVTDCLSPEC) === "*YES");
    }

    ui.addParagraph('FULLYFREE : <code>*YES</code>')
        .addInput("MAXNOTFREE", l10n.t("Max number of blocks not free"), "", { default: config.MAXNOTFREE, readonly: true })
        .addInput("FIRSTCOL", l10n.t("First Column (fully free)"), "", { default: config.FIRSTCOL.toString(), readonly: true })
        .addHorizontalRule()
        .addCheckbox("CVT_CALL", l10n.t("Convert Program calls"), "", convertBool(config.CVT_CALL) === "*YES")
        .addSelect("CVT_GOTO", l10n.t("Convert Goto"), generateOptions(getConvertOptions(), config.CVT_GOTO))
        .addInput("TAGFLDNAME", l10n.t("Goto Label"), "", { default: config.TAGFLDNAME })
        .addCheckbox("CVT_KLIST", l10n.t("Convert Key List"), "", convertBool(config.CVT_KLIST) === "*YES")
        .addSelect("CVT_MOVEA", l10n.t("Convert MOVEA"), generateOptions(getConvertOptions(), config.CVT_MOVEA))
        .addSelect("INDENT", l10n.t("Indentation Size (char)"), generateOptions(getIndentSizeOptions(), config.INDENT.toString()))
        .addCheckbox("INDENTCMT", l10n.t("Indent Comments"), "", convertBool(config.INDENTCMT) === "*YES")
        .addSelect("EMPTYCMT", l10n.t("Empty Comment Lines"), generateOptions(getEmptyCommentLinesOptions(), config.EMPTYCMT))
        .addSelect("OPCODECASE", l10n.t("Case for operation codes"), generateOptions(getCaseOptions(), config.OPCODECASE))
        .addSelect("BLTFNCCASE", l10n.t("Case for the B.i.F."), generateOptions(getCaseOptions(), config.BLTFNCCASE))
        .addSelect("SPCWRDCASE", l10n.t("Case for special words"), generateOptions(getCaseOptions(), config.SPCWRDCASE))
        .addSelect("KEYWRDCASE", l10n.t("Case for key words"), generateOptions(getCaseOptions(), config.KEYWRDCASE))
        .addCheckbox("USEPARMNUM", l10n.t("Use %ParmNum"), "", convertBool(config.USEPARMNUM) === "*YES")
        .addParagraph('Convert Subr. to Procedure : <code>*NO</code>');

    return ui;
}


// Advanced Conversion Options Tab
function createAdvancedOptions(config: CommandParams): CustomUI {
    return Code4i.customUI()
        .addHeading(l10n.t("Advanced Options"), 3)
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
        .addSelect("NUMTRUNCD", l10n.t("DIV:"), generateOptions(getTruncationOptions(), config.NUMTRUNCD))
        .addSelect("KEEPDSIND", l10n.t("Keep indentation in the DS:"), generateOptions(getWarningOptions(), config.KEEPDSIND))
        .addHorizontalRule()
        .addSelect("ALPHTONUM", l10n.t("Analyze Alpha to num. MOVE:"), generateOptions(getAlphaToNumOptions(), config.ALPHTONUM))
        .addSelect("PRECPL", l10n.t("Precompilation Clauses:"), generateOptions(getPrecompilationOptions(), config.PRECPL))
        .addSelect("SRCDATE", l10n.t("Source Line Date:"), generateOptions(getSourceLineDate(), config.SRCDATE))
        .addSelect("FLGCVTTYPE", l10n.t("Mark the conversion type:"), generateOptions(getBooleanOptionsWithKeep(), config.FLGCVTTYPE))
        .addCheckbox("CLRXREF", l10n.t("Clean Temporary Cross-reference:"), "", convertBool(config.CLRXREF) === "*YES")
        .addCheckbox("CLRFRMCHG", l10n.t("Clean Modified Lines:"), "", convertBool(config.CLRFRMCHG) === "*YES");

}

function createPropertiesTable(target: ConversionTarget): string {
    return `<table>
        ${addRow(l10n.t("Source Library"), target.library)}
        ${addRow(l10n.t("Source File"), target.file)}
        ${addRow(l10n.t("Source Member"), target.member || "*ALL")}
        ${target.extension ? addRow(l10n.t("Source Type"), target.extension) : ""}
    </table>`;
}


function addRow(key: string, value?: any): string {
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


export async function showConversionReport(report: ExecutionReport[], itemName: string): Promise<void> {
    const title = l10n.t("Conversion Report-{0}", itemName);
    const page = await commandReportUI(report).loadPage(title);
}



function commandReportUI(report: ExecutionReport[]) {
    return Code4i.customUI()
        .setOptions({ fullWidth: true })
        .addHeading(l10n.t("Conversion Results"), 3)
        .addParagraph(createReportTable(report));
}

function createReportTable(results: ExecutionReport[]): string {
    return /* html */ `
        <style>
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                border: 1px solid var(--vscode-editor-foreground);
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            tr:nth-child(even) {
                background-color: var(--vscode-editor-background);
            }
            tr:hover {
                background-color: var(--vscode-editor-hoverHighlightBackground);
            }
        </style>
        <table>
            <tr>
              <th>${l10n.t("Member Name")}</th>
              <th>${l10n.t("Output")}</th>
            </tr>
            ${results.map(result => {
        const ok = result.result.code === 0;
        const messages = Code4i.getTools().parseMessages(result.result.stdout || result.result.stderr);
        return /* html */` <tr style="color: ${getStatusColor(ok, messages)};">
                  <td>${result.target.member} (${result.target.objectType || '-'})</td>
                  <td>${messages.messages.filter(filterConversionMessage).map(m => `- [${m.id}] ${m.text}`).join("<br />")}</td>
              </tr>`;
    }).join("")}
        </table>`;
}
