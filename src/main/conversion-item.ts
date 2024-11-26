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
    totalSteps: number;
    title?: string;
    step: number;
}

const initState = (): State => ({ connectionName: '', listName: '', libraryName: '', sourceFileName: '', totalSteps: 4, title: '', step: 1 });

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;
export async function ConversionListItemStepper(): Promise<ConversionList | undefined> {
    const state = initState();
    state.title = l10n.t('Create Conversion List');
    state.step = 1;
    state.totalSteps = 4;
    await MultiStepInput.run(async (input: MultiStepInput) => getIbmiConnection(input, state));
    if (!state.connectionName || !state.listName || !state.libraryName || !state.sourceFileName) {
        return undefined;
    } else {
        return {
            connectionname: state.connectionName || '',
            listname: state.listName.toUpperCase() || '',
            description: '',
            targetlibrary: state.libraryName || '',
            targetsourcefile: state.sourceFileName || '',
            items: [],
        };
    }
}

async function getIbmiConnection(input: MultiStepInput, state: State): Promise<InputStep> {
    const connection = await input.showQuickPick({
        title: l10n.t('Choose IBMi Connection'),
        step: 1,
        totalSteps: state.totalSteps,
        items: getIbmiConnections().map(c => ({ label: c.name, description: l10n.t('Username: {0} | {1}:{2}', c.username, c.host, c.port) })) || [],
        placeholder: l10n.t('Select a connection'),
        shouldResume: () => Promise.resolve(false),
    });

    state.connectionName = connection.label;
    return (input: MultiStepInput) => getListName(input, state);
}

async function getListName(input: MultiStepInput, state: State): Promise<InputStep> {
    state.listName = await input.showInputBox({
        title: l10n.t('List Name'),
        step: state.step + 1,
        totalSteps: state.totalSteps,
        prompt: l10n.t('Enter the name of the conversion list'),
        validate: async (value) => validateListName(value),
        shouldResume: () => Promise.resolve(false),
        value: state.listName || '',
    });

    return (input: MultiStepInput) => getLibraryName(input, state);

}

async function getLibraryName(input: MultiStepInput, state: State): Promise<InputStep> {
    state.libraryName = await input.showInputBox({
        title: l10n.t('Target Library Name'),
        step: state.step + 1,
        totalSteps: state.totalSteps,
        prompt: l10n.t('Enter the name of the Target library'),
        shouldResume: () => Promise.resolve(false),
        validate: async (value) => {
            if (!value) {
                return l10n.t('Library name is required.');
            }
            return undefined;
        },
        value: state.libraryName || '',
    });
    return (input: MultiStepInput) => getSourceFileName(input, state);
}

async function getSourceFileName(input: MultiStepInput, state: State) {
    state.sourceFileName = await input.showInputBox({
        title: l10n.t('Target Source File Name'),
        step: state.step + 1,
        totalSteps: state.totalSteps,
        prompt: l10n.t('Enter the name of the Target Source file'),
        shouldResume: () => Promise.resolve(false),
        validate: async (value) => {
            if (!value) {
                return l10n.t('Source file name is required.');
            }
            return undefined;
        },
        value: state.sourceFileName || '',
    });
}

async function validateListName(name: string): Promise<string | undefined> {
    if (!name) {
        return l10n.t('List name is required.');
    }
    const existingLists = await ConfigManager.getConversionList();
    if (existingLists.some(list => list.listname === name)) {
        return l10n.t('The list name "{0}" already exists. Please choose a different name.', name);
    }
    return undefined;
}

function getIbmiConnections(): Connections {
    return ConfigManager.getConnections() || [];
}
