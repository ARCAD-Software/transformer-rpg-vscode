export const REPORT_UI_GLOBAL_CSS = /* html */ `
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    background-color: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    overflow-x: hidden;
}

vscode-label {
    font-weight: 600;
    color: var(--vscode-foreground);
    display: inline-block;
    margin-bottom: 8px;
}

h3 {
    color: var(--vscode-titleBar-activeForeground);
    border-bottom: 2px solid var(--vscode-button-background);
    font-size: 1.2em;
}

.content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 15px;
}
`;

export const REPORT_TABLE_CSS = /* html */ `
.table-container {
    width: 75vw;
    min-width: 800px;
    max-width: 95vw;
    margin: 20px auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--vscode-panel-border);
    max-height: 80vh;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    background-color: var(--vscode-editor-background);
    margin: 0;
    table-layout: fixed;
}

th {
    background: linear-gradient(135deg, var(--vscode-button-background), var(--vscode-button-hoverBackground));
    color: var(--vscode-button-foreground);
    font-weight: 600;
    padding: 6px 14px;
    text-align: left;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid var(--vscode-button-background);
    position: sticky;
    top: 0;
    z-index: 10;
}

th:first-child {
    width: 25%;
    min-width: 200px;
}

th:last-child {
    width: 75%;
}

td {
    padding: 1px 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
    transition: all 0.2s ease;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

td:first-child {
    width: 25%;
    min-width: 200px;
}

td:last-child {
    width: 75%;
    max-width: 0;
}

tr:nth-child(even) {
    background-color: var(--vscode-list-evenBackground, rgba(255, 255, 255, 0.02));
}

tr:nth-child(odd) {
    background-color: var(--vscode-list-oddBackground, transparent);
}

.member-name {
    font-weight: 600;
    margin-bottom: 4px;
}

.object-type {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    font-style: italic;
}

.message-item {
    display: block;
    margin: 4px 0;
    padding: 4px 8px;
    background-color: var(--vscode-textCodeBlock-background);
    border-left: 3px solid var(--vscode-button-background);
    border-radius: 0 4px 4px 0;
    font-family: var(--vscode-editor-font-family);
    font-size: 12px;
    line-height: 1.4;
    word-break: break-word;
}

.message-id {
    font-weight: 600;
    color: var(--vscode-textLink-foreground);
}

.table-container::-webkit-scrollbar {
    width: 8px;
}

.table-container::-webkit-scrollbar-track {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-hoverBackground);
    border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
    background: var(--vscode-scrollbarSlider-activeBackground);
}

@media (max-width: 1200px) {
    .table-container {
        width: 85vw;
    }
}
`;
