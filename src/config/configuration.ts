import { ConfigurationTarget, ExtensionContext, l10n, workspace } from 'vscode';
import { tfrrpgOutput } from '../extension';
import { defaultConfig } from './defaults';
import { ConversionList, ConversionItem } from '../models/conversionListBrowser';
import { CommandParams } from '../models/command';
import { Connections } from '../models/connection';

export namespace ConfigManager {
    let extensioncontext: ExtensionContext;
    export function getConfiguration(scope: ConfigurationTarget = ConfigurationTarget.Global) {
        return workspace.getConfiguration('arcad-transformer-rpg', scope === ConfigurationTarget.Workspace ? undefined : null);
    }

    export function getParams(): CommandParams | undefined {
        const config = getConfiguration();
        return config.get<CommandParams>('command');
    }

    export async function setParams(params: CommandParams): Promise<void> {
        //Coyp parameters and remove transient fields
        const savedParams = { ...params };
        delete savedParams.buttons;
        delete savedParams.OBJTYPE;
        delete savedParams.SRCLIB;
        delete savedParams.SRCMBR;
        delete savedParams.SRCTYPE;
        delete savedParams.SRCFILE;
        delete savedParams.TOSRCLIB;
        delete savedParams.TOSRCFILE;
        delete savedParams.TOSRCMBR;

        await getConfiguration().update('command', savedParams, ConfigurationTarget.Global);
    }
    export function getConnections(): Connections | undefined {
        return workspace.getConfiguration('code-for-ibmi').get('connections');
    }

    export async function getConversionList(): Promise<ConversionList[]> {
        return extensioncontext.globalState.get<ConversionList[]>('conversionList', []);
    }

    export async function saveConversionList(list: ConversionList[]): Promise<void> {
        await extensioncontext.globalState.update('conversionList', list);
    }

    export async function addConversionList(newList: ConversionList): Promise<void> {
        const conversionList = await getConversionList();
        conversionList.push(newList);
        await saveConversionList(conversionList);
    }

    async function getConversionListIndex(listname: string): Promise<number> {
        const conversionList = await getConversionList();
        return conversionList.findIndex(list => list.listname.toUpperCase() === listname.toUpperCase());
    }

    async function saveConversionListIfNeeded(conversionList: ConversionList[], index: number, action: () => void): Promise<void> {
        if (index !== -1) {
            action();
            await saveConversionList(conversionList);
        }
    }

    export async function updateConversionList(updatedList: ConversionList): Promise<void> {
        const conversionList = await getConversionList();
        const index = await getConversionListIndex(updatedList.listname);

        await saveConversionListIfNeeded(conversionList, index, () => {
            conversionList[index] = updatedList;
        });
    }

    export async function removeConversionList(listname: string): Promise<void> {
        const conversionList = await getConversionList();
        const index = await getConversionListIndex(listname);

        await saveConversionListIfNeeded(conversionList, index, () => {
            conversionList.splice(index, 1);
        });
    }


    export async function removeConversionItem(listname: string, itemname: string): Promise<void> {
        const conversionList = await getConversionList();
        const listIndex = await getConversionListIndex(listname);

        if (listIndex !== -1) {
            const itemIndex = conversionList[listIndex].items.findIndex(item => item.member === itemname);
            await saveConversionListIfNeeded(conversionList, itemIndex, () => {
                conversionList[listIndex].items.splice(itemIndex, 1);
            });
        }
    }

    export async function updateConversionItem(listname: string, itemname: string, newItem: Partial<ConversionItem>): Promise<void> {
        const conversionList = await getConversionList();
        const listIndex = await getConversionListIndex(listname);

        if (listIndex !== -1) {
            const itemIndex = conversionList[listIndex].items.findIndex(item => item.member === itemname);
            await saveConversionListIfNeeded(conversionList, itemIndex, () => {
                conversionList[listIndex].items[itemIndex] = {
                    ...conversionList[listIndex].items[itemIndex],
                    ...newItem,
                    targetmember: newItem.targetmember ?? ''
                };
            });
        }
    }

    export function forceStandaloneProduct() {
        return getConfiguration().get<boolean>("forceUseOfStandaloneProduct", false);
    }

    export function checkPrereleaseUpdates() {
        return getConfiguration().get<boolean>("checkPrereleaseUpdates", false);
    }

    export async function initializeConfiguration(context: ExtensionContext): Promise<void> {
        extensioncontext = context;
        const configKey = "arcad-transformer-rpg.command";
        const config = workspace.getConfiguration();
        const currentConfig = config.get<CommandParams>(configKey);

        if (!currentConfig || Object.keys(currentConfig).length === 0) {
            await config.update(configKey, defaultConfig, ConfigurationTarget.Global);
            tfrrpgOutput().appendLine(l10n.t("Default configuration set for ARCAD Transformer RPG."));
        } else {
            tfrrpgOutput().appendLine(l10n.t("Configuration already exists. Skipping default configuration initialization."));
        }
    }
}


