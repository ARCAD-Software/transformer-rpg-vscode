import { l10n } from "vscode";
import type { IBMiMessage } from "@halcyontech/vscode-ibmi-types";
import { Code4i } from "../../platform/ibmi/code4i";
import { convertBool } from "../../utils/helper";
import { generateOptions, getAlphaToNumOptions, getBooleanOptions, getBooleanOptionsWithKeep, getCalculationSpecOptions, getCaseOptions, getConvertOptions, getEmptyCommentLinesOptions, getFirstColumnOptions, getIndentSizeOptions, getIndicatorOptions, getObjectTypes, getPrecompilationOptions, getSourceLineDate, getTruncationOptions, getWarningOptions } from "./commandOptions";
import { ComplexTab, CustomUI } from "@halcyontech/vscode-ibmi-types/webviews/CustomUI";
import { filterConversionMessage, getStatusColor } from "../../models/conversionStatus";
import { CommandParams } from "../../models/commandParams";
import { SourceMember } from "../../models/sourceMember";
import { ExecutionReport } from "../../models/executionReport";
import { CONFIG_PANEL_CSS, REPORT_TABLE_CSS, REPORT_UI_GLOBAL_CSS } from "./customCss";
import { helpHtml } from "./commandHelp";

export function createTabs(member: SourceMember, config: CommandParams): ComplexTab[] {
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
        .setOptions({ css: CONFIG_PANEL_CSS })
        .addHeading(multiple ? l10n.t("Multiple Members Conversion") : l10n.t("Single Member Conversion"), 2)
        .addParagraph(`<p class="hint">${l10n.t("Review the options below, then convert. Expand 'Show details' under a field to see what each value does.")}</p>`)
        .addComplexTabs(tabs)
        .addHorizontalRule()
        .addButtons({ id: "convert", label: l10n.t("Convert") })
        .addButtons({ id: "convertnsave", label: l10n.t("Convert and Save Config") });
}

// Properties Tab
function createPropertiesUI(conversion: SourceMember, config: CommandParams): CustomUI {
    const ui = Code4i.customUI();
    ui.addHeading(l10n.t("Source Member"), 3)
        .addParagraph(createPropertiesTable(conversion));

    if (conversion.name) {
        ui.addSelect("OBJTYPE", l10n.t("Object Type"), generateOptions([...getObjectTypes(), "*NONE"], conversion.objectType), helpHtml("OBJTYPE"));
    }

    ui.addHeading(l10n.t("What to Convert"), 3)
        .addSelect("CVTCLCSPEC", l10n.t("Convert Calculation Specs"), generateOptions(getCalculationSpecOptions(), config.CVTCLCSPEC), helpHtml("CVTCLCSPEC"))
        .addCheckbox("CVTDCLSPEC", l10n.t("Convert Declaration Specs"), helpHtml("CVTDCLSPEC"), convertBool(config.CVTDCLSPEC) === "*YES")
        .addHeading(l10n.t("Destination"), 3)
        .addInput("TOSRCLIB", l10n.t("Library"), l10n.t("Library of the destination source file."), { default: conversion.library })
        .addInput("TOSRCFILE", l10n.t("Source File"), helpHtml("TOSRCFILE"), { default: conversion.file, readonly: false });

    if (conversion.name) {
        ui.addInput("TOSRCMBR", l10n.t("Source Member"), helpHtml("TOSRCMBR"), { default: "*FROMMBR" });
    }

    ui.addHeading(l10n.t("Behavior"), 3)
        .addCheckbox("REPLACE", l10n.t("Replace Existing Member"), helpHtml("REPLACE"), convertBool(config.REPLACE) === "*YES")
        .addCheckbox("EXPCSPECPY", l10n.t("Expand Copy Book with C-Spec"), helpHtml("EXPCSPECPY"), convertBool(config.EXPCSPECPY) === "*YES");

    return ui;
}

// Conversion Options Tab
function createConversionOptions(config: CommandParams, targetConversion = false): CustomUI {
    const ui = Code4i.customUI();

    if (targetConversion) {
        ui.addHeading(l10n.t("Destination Behavior"), 3)
            .addCheckbox("REPLACE", l10n.t("Replace Existing Member"), helpHtml("REPLACE"), convertBool(config.REPLACE) === "*YES")
            .addCheckbox("EXPCSPECPY", l10n.t("Expand Copy Book with C-Spec"), helpHtml("EXPCSPECPY"), convertBool(config.EXPCSPECPY) === "*YES")
            .addCheckbox("CVTDCLSPEC", l10n.t("Convert Declaration Specs"), helpHtml("CVTDCLSPEC"), convertBool(config.CVTDCLSPEC) === "*YES");
    }

    ui.addHeading(l10n.t("Fully-Free Format"), 3)
        .addSelect("FULLYFREE", l10n.t("Convert to Fully-Free"), generateOptions(getBooleanOptions(), config.FULLYFREE), helpHtml("FULLYFREE"))
        .addInput("MAXNOTFREE", l10n.t("Max number of blocks not free"), helpHtml("MAXNOTFREE"), { default: config.MAXNOTFREE })
        .addSelect("FIRSTCOL", l10n.t("First Column (fully free)"), generateOptions(getFirstColumnOptions(), config.FIRSTCOL.toString()), helpHtml("FIRSTCOL"))
        .addHeading(l10n.t("Code Transformations"), 3)
        .addCheckbox("CVT_CALL", l10n.t("Convert Program calls"), helpHtml("CVT_CALL"), convertBool(config.CVT_CALL) === "*YES")
        .addSelect("CVT_GOTO", l10n.t("Convert Goto"), generateOptions(getConvertOptions(), config.CVT_GOTO), helpHtml("CVT_GOTO"))
        .addInput("TAGFLDNAME", l10n.t("Goto Label"), helpHtml("TAGFLDNAME"), { default: config.TAGFLDNAME })
        .addCheckbox("CVT_KLIST", l10n.t("Convert Key List"), helpHtml("CVT_KLIST"), convertBool(config.CVT_KLIST) === "*YES")
        .addSelect("CVT_MOVEA", l10n.t("Convert MOVEA"), generateOptions(getConvertOptions(), config.CVT_MOVEA), helpHtml("CVT_MOVEA"))
        .addSelect("CVT_SUBR", l10n.t("Convert Subr. to Procedure"), generateOptions(getBooleanOptions(), config.CVT_SUBR), helpHtml("CVT_SUBR"))
        .addCheckbox("USEPARMNUM", l10n.t("Use %ParmNum"), helpHtml("USEPARMNUM"), convertBool(config.USEPARMNUM) === "*YES")
        .addHeading(l10n.t("Formatting"), 3)
        .addSelect("INDENT", l10n.t("Indentation Size (char)"), generateOptions(getIndentSizeOptions(), config.INDENT.toString()), helpHtml("INDENT"))
        .addCheckbox("INDENTCMT", l10n.t("Indent Comments"), helpHtml("INDENTCMT"), convertBool(config.INDENTCMT) === "*YES")
        .addSelect("EMPTYCMT", l10n.t("Empty Comment Lines"), generateOptions(getEmptyCommentLinesOptions(), config.EMPTYCMT), helpHtml("EMPTYCMT"))
        .addHeading(l10n.t("Letter Case"), 3)
        .addSelect("OPCODECASE", l10n.t("Case for operation codes"), generateOptions(getCaseOptions(), config.OPCODECASE), helpHtml("OPCODECASE"))
        .addSelect("BLTFNCCASE", l10n.t("Case for the B.i.F."), generateOptions(getCaseOptions(), config.BLTFNCCASE), helpHtml("BLTFNCCASE"))
        .addSelect("SPCWRDCASE", l10n.t("Case for special words"), generateOptions(getCaseOptions(), config.SPCWRDCASE), helpHtml("SPCWRDCASE"))
        .addSelect("KEYWRDCASE", l10n.t("Case for key words"), generateOptions(getCaseOptions(), config.KEYWRDCASE), helpHtml("KEYWRDCASE"));

    return ui;
}


// Advanced Conversion Options Tab
function createAdvancedOptions(config: CommandParams): CustomUI {
    return Code4i.customUI()
        .addHeading(l10n.t("Analyze Indicator Problems"), 3)
        .addSelect("CHECKIND", l10n.t("CHECK"), generateOptions(getIndicatorOptions(), config.CHECKIND), helpHtml("CHECKIND"))
        .addSelect("SCANIND", l10n.t("SCAN"), generateOptions(getIndicatorOptions(), config.SCANIND), helpHtml("SCANIND"))
        .addSelect("LOOKUPIND", l10n.t("LOOKUP"), generateOptions(getIndicatorOptions(), config.LOOKUPIND), helpHtml("LOOKUPIND"))
        .addHeading(l10n.t("Analyze Numeric Truncation"), 3)
        .addSelect("NUMTRUNCZ", l10n.t("Z-ADD, Z-SUB"), generateOptions(getTruncationOptions(), config.NUMTRUNCZ), helpHtml("NUMTRUNCZ"))
        .addSelect("NUMTRUNCA", l10n.t("ADD, SUB {Length(Fact1/Fact2)>Length(Result)}"), generateOptions(getTruncationOptions(), config.NUMTRUNCA), helpHtml("NUMTRUNCA"))
        .addSelect("NUMTRUNCB", l10n.t("ADD, SUB {Other}"), generateOptions(getTruncationOptions(), config.NUMTRUNCB), helpHtml("NUMTRUNCB"))
        .addSelect("NUMTRUNCM", l10n.t("MULT"), generateOptions(getTruncationOptions(), config.NUMTRUNCM), helpHtml("NUMTRUNCM"))
        .addSelect("NUMTRUNCD", l10n.t("DIV"), generateOptions(getTruncationOptions(), config.NUMTRUNCD), helpHtml("NUMTRUNCD"))
        .addHeading(l10n.t("Analyze Data Assignment"), 3)
        .addSelect("ALPHTONUM", l10n.t("Alpha to num. MOVE"), generateOptions(getAlphaToNumOptions(), config.ALPHTONUM), helpHtml("ALPHTONUM"))
        .addHeading(l10n.t("Converted Source Output"), 3)
        .addSelect("KEEPDSIND", l10n.t("Keep indentation in the DS"), generateOptions(getWarningOptions(), config.KEEPDSIND), helpHtml("KEEPDSIND"))
        .addSelect("PRECPL", l10n.t("Precompilation Clauses"), generateOptions(getPrecompilationOptions(), config.PRECPL), helpHtml("PRECPL"))
        .addSelect("SRCDATE", l10n.t("Source Line Date"), generateOptions(getSourceLineDate(), config.SRCDATE), helpHtml("SRCDATE"))
        .addSelect("FLGCVTTYPE", l10n.t("Mark the conversion type"), generateOptions(getBooleanOptionsWithKeep(), config.FLGCVTTYPE), helpHtml("FLGCVTTYPE"))
        .addHeading(l10n.t("Cleanup"), 3)
        .addCheckbox("CLRXREF", l10n.t("Clean Temporary Cross-reference"), helpHtml("CLRXREF"), convertBool(config.CLRXREF) === "*YES")
        .addCheckbox("CLRFRMCHG", l10n.t("Clean Modified Lines"), helpHtml("CLRFRMCHG"), convertBool(config.CLRFRMCHG) === "*YES");
}

function createPropertiesTable(target: SourceMember): string {
    return `<table>
        ${addRow(l10n.t("Source Library"), target.library)}
        ${addRow(l10n.t("Source File"), target.file)}
        ${addRow(l10n.t("Source Member"), target.name || "*ALL")}
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
    const title = l10n.t(`(${generateShortId()})Conversion Report-{0}`, itemName);
    commandReportUI(report).loadPage(title);
}


function commandReportUI(report: ExecutionReport[]) {
    return Code4i.customUI()
        .setOptions({
            fullWidth: true,
            css: REPORT_UI_GLOBAL_CSS
        })
        .addHeading(l10n.t("Conversion Results"), 3)
        .addParagraph(createReportTable(report));
}
/**
 * On success, shows every message of the job log (stderr).
 * On failure, stdout only holds the message id(s) of the error: their descriptions are taken from stderr.
 */
function getReportMessages(result: ExecutionReport["result"], isSuccess: boolean, stderrMessages: IBMiMessage[]): IBMiMessage[] {
    if (isSuccess) {
        return stderrMessages;
    }

    const failedIds = [...(result.stdout || "").matchAll(/\[([A-Z0-9]{7})\]/g)].map(match => match[1]);
    if (!failedIds.length) {
        return stderrMessages;
    }

    return failedIds.map(id => stderrMessages.find(message => message.id === id) ?? { id, text: "" });
}

function createReportTable(results: ExecutionReport[]): string {
    const rows = results.map(result => {
        const isSuccess = result.result.code === 0;
        const messages = Code4i.getTools().parseMessages(result.result.stderr || result.result.stdout);
        const filteredMessages = getReportMessages(result.result, isSuccess, messages.messages)
            .filter(filterConversionMessage)
            .map(m => `<span class="message-item"><span class="message-id">[${m.id}]</span> ${m.text}</span>`)
            .join("");

        return /* html */ `
            <tr style="color: ${getStatusColor(isSuccess, messages)};">
                <td>
                    <span class="member-name">${result.target.name}</span>
                    <span class="object-type">(${result.target.objectType || '-'})</span>
                </td>
                <td>${filteredMessages}</td>
            </tr>
        `;
    }).join("");

    return /* html */ `
        <style>${REPORT_TABLE_CSS}</style>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>${l10n.t("Member Name")}</th>
                        <th>${l10n.t("Output")}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

export const generateShortId = (): string => {
    const now = new Date();
    return now.getFullYear().toString().slice(-2) +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0") +
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0") +
        now.getSeconds().toString().padStart(2, "0");
};