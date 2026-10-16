import { COMMAND_HELP_TEXT } from "./commandHelpText";

const SEPARATOR = "---";

function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderDetails(lines: string[]): string {
    const html: string[] = [];
    let listItems: string[] = [];
    let codeLines: string[] | undefined;

    const flushList = () => {
        if (listItems.length) {
            html.push(`<ul>${listItems.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
            listItems = [];
        }
    };

    for (const line of lines) {
        if (codeLines) {
            if (line.trim() === "@end") {
                html.push(`<pre>${escapeHtml(codeLines.join("\n"))}</pre>`);
                codeLines = undefined;
            } else {
                codeLines.push(line);
            }
            continue;
        }

        const text = line.trim();
        if (text.startsWith("- ")) {
            listItems.push(text.slice(2));
            continue;
        }

        flushList();
        if (text === "@code") {
            codeLines = [];
        } else if (text.startsWith("## ")) {
            html.push(`<div class="hlp-value"><code>${escapeHtml(text.slice(3))}</code></div>`);
        } else if (text) {
            html.push(`<p>${escapeHtml(text)}</p>`);
        }
    }
    flushList();

    return html.join("");
}

function renderHelp(text: string): string {
    const lines = text.split("\n");
    const separator = lines.findIndex(line => line.trim() === SEPARATOR);
    const summaryLines = separator < 0 ? lines : lines.slice(0, separator);
    const detailLines = separator < 0 ? [] : lines.slice(separator + 1);

    const summary = `<span class="hlp-sum">${summaryLines.map(line => escapeHtml(line.trim())).join("<br>")}</span>`;
    const details = renderDetails(detailLines);
    return details ? `${summary}<details class="hlp"><summary>Show details</summary>${details}</details>` : summary;
}

const cache = new Map<string, string>();

export function helpHtml(key: string): string {
    const text = COMMAND_HELP_TEXT[key];
    if (!text) {
        return "";
    }

    let html = cache.get(key);
    if (html === undefined) {
        html = renderHelp(text);
        cache.set(key, html);
    }
    return html;
}
