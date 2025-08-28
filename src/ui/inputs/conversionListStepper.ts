import { l10n } from "vscode";
import { ConfigManager } from "../../config/configuration";
import { ConversionList } from "../../models/conversionListBrowser";
import { MultiStepInput, InputStep } from "../../utils/stepper";
import { Connections } from "../../models/connection";


type NewConversionListState = Omit<ConversionList, 'items'> & {
    title?: string;
    step: number;
    totalSteps: number;
};

const initState = (): NewConversionListState => ({} as NewConversionListState);


export async function ConversionListItemStepper(): Promise<ConversionList | undefined> {
    const state = initState();
    state.title = l10n.t('Create Conversion List');
    state.step = 1;
    state.totalSteps = 5;
    await MultiStepInput.run(async (input: MultiStepInput) => getIbmiConnection(input, state));
    if (!state.connectionname || !state.listname || !state.targetlibrary || !state.targetsourcefile) {
        return undefined;
    } else {
        return {
            ...state,
            items: []
        };
    }
}

async function getIbmiConnection(input: MultiStepInput, state: NewConversionListState): Promise<InputStep> {
    const connection = await input.showQuickPick({
        title: l10n.t('Choose IBMi Connection'),
        step: state.step++,
        totalSteps: state.totalSteps,
        items: getIbmiConnections().map(c => ({ label: c.name, description: l10n.t('Username: {0} | {1}:{2}', c.username, c.host, c.port) })) || [],
        placeholder: l10n.t('Select a connection'),
        shouldResume: () => Promise.resolve(false),
    });

    state.connectionname = connection.label;
    return (input: MultiStepInput) => getListName(input, state);
}

async function getListName(input: MultiStepInput, state: NewConversionListState): Promise<InputStep> {
    state.listname = await input.showInputBox({
        title: l10n.t('List Name'),
        step: state.step++,
        totalSteps: state.totalSteps,
        prompt: l10n.t('Enter the name of the conversion list'),
        validate: async (value) => validateListName(value),
        shouldResume: () => Promise.resolve(false),
        value: state.listname || '',
    });

    return (input: MultiStepInput) => getDescription(input, state);
}

async function getDescription(input: MultiStepInput, state: NewConversionListState): Promise<InputStep> {
    state.description = await input.showInputBox({
        title: l10n.t('Description'),
        step: state.step++,
        totalSteps: state.totalSteps,
        prompt: l10n.t('Enter a description for the conversion list (optional)'),
        shouldResume: () => Promise.resolve(false),
        validate: async () => undefined,
        value: state.description || '',
    });

    return (input: MultiStepInput) => getLibraryName(input, state);
}


async function getLibraryName(input: MultiStepInput, state: NewConversionListState): Promise<InputStep> {
    state.targetlibrary = await input.showInputBox({
        title: l10n.t('Target Library Name'),
        step: state.step++,
        totalSteps: state.totalSteps,
        prompt: l10n.t('Enter the name of the Target library'),
        shouldResume: () => Promise.resolve(false),
        validate: async (value) => {
            if (!value) {
                return l10n.t('Library name is required.');
            }
            return undefined;
        },
        value: state.targetlibrary || '',
    });
    return (input: MultiStepInput) => getSourceFileName(input, state);
}

async function getSourceFileName(input: MultiStepInput, state: NewConversionListState) {
    state.targetsourcefile = await input.showInputBox({
        title: l10n.t('Target Source File Name'),
        step: state.step++,
        totalSteps: state.totalSteps,
        prompt: l10n.t('Enter the name of the Target Source file'),
        shouldResume: () => Promise.resolve(false),
        validate: async (value) => {
            if (!value) {
                return l10n.t('Source file name is required.');
            }
            return undefined;
        },
        value: state.targetsourcefile || '',
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
