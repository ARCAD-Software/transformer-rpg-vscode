import { l10n, QuickPickItem } from "vscode";
import { MultiStepInput } from "../utils/stepper";
import { ConfigManager } from "../configuration";
import { Connections } from "./model";
import { ConversionList } from "./views/conversionListBrowser";

interface State {
    connectionName: string;
    listName: string;
    libraryName: string;
    sourceFileName: string;
}

export async function ConversionListItemStepper(): Promise<ConversionList | undefined> {
    const state: Partial<State> = {};
    await MultiStepInput.run((input: MultiStepInput) => collectInputs(input, state));
    if (!state.connectionName || !state.listName || !state.libraryName || !state.sourceFileName) {
        return undefined;
    } else {
        return {
            connectionname: state.connectionName || '',
            listname: state.listName.toUpperCase() || '',
            listdescription: '',
            library: state.libraryName || '',
            sourcefile: state.sourceFileName || '',
            items: [],
        };
    }
}

async function collectInputs(input: MultiStepInput, state: Partial<State>) {
    const connections = getIbmiConnections();
    if (connections.length === 0) {
        throw new Error('No connections available. Please configure your connections.');
    }

    // Step 1: Select Connection Name
    state.connectionName = await input.showQuickPick({
        title: l10n.t('IBMi Connection Name'),
        step: 1,
        totalSteps: 4,
        items: connections.map(c => ({ label: c.name, description: `Username: ${c.username} | ${c.host}:${c.port}` })),
        placeholder: 'Select a connection',
        shouldResume: () => Promise.resolve(false),
    }).then((item: QuickPickItem) => item.label);

    // Step 2: Enter List Name
    state.listName = await input.showInputBox({
        title: l10n.t('List Name'),
        step: 2,
        totalSteps: 4,
        prompt: 'Enter the name of the conversion list',
        validate: async (value) => validateListName(value),
        shouldResume: () => Promise.resolve(false),
        value: state.listName || '',
    });

    // Step 3: Enter Library Name
    state.libraryName = await input.showInputBox({
        title: l10n.t('Library Name'),
        step: 3,
        totalSteps: 4,
        prompt: 'Enter the name of the library',
        shouldResume: () => Promise.resolve(false),
        validate: async (value) => {
            if (!value) {
                return 'Library name is required.';
            }
            return undefined;
        },
        value: state.libraryName || '',
    });

    // Step 4: Enter Source File Name
    state.sourceFileName = await input.showInputBox({
        title: l10n.t('Source File Name'),
        step: 4,
        totalSteps: 4,
        prompt: 'Enter the name of the source file',
        shouldResume: () => Promise.resolve(false),
        validate: async (value) => {
            if (!value) {
                return 'Source file name is required.';
            }
            return undefined;
        },
        value: state.sourceFileName || '',
    });
}

async function validateListName(name: string): Promise<string | undefined> {
    if (!name) {
        return 'List name is required.';
    }
    const existingLists = await ConfigManager.getConversionList();
    if (existingLists.some(list => list.listname === name)) {
        return `The list name "${name}" already exists. Please choose a different name.`;
    }
    return undefined;
}

function getIbmiConnections(): Connections {
    return ConfigManager.getConnections() || [];
}
