import { ConfigurationTarget, l10n, workspace } from 'vscode';
import { tfrrpgOutput } from './extension';
import { Connections } from './main/model';
import { ConversionItem, ConversionList } from './main/views/conversionListBrowser';
export interface CommandParams {
    CVTCLCSPEC: string;
    CVTDCLSPEC: string;
    EXPCSPECPY: string;
    FULLYFREE: string;
    MAXNOTFREE: string;
    FIRSTCOL: number;
    USEPARMNUM: string;
    REPLACE: string;
    CVT_CALL: string;
    CVT_GOTO: string;
    TAGFLDNAME: string;
    CVT_KLIST: string;
    CVT_MOVEA: string;
    INDENT: number;
    INDENTCMT: string;
    OPCODECASE: string;
    BLTFNCCASE: string;
    SPCWRDCASE: string;
    KEYWRDCASE: string;
    FLGCVTTYPE: string;
    CLRXREF: string;
    CLRFRMCHG: string;
    PRECPL: string;
    SRCDATE: string;
    CVT_SUBR: string;
    CHECKIND: string;
    SCANIND: string;
    LOOKUPIND: string;
    NUMTRUNCZ: string;
    NUMTRUNCA: string;
    NUMTRUNCB: string;
    NUMTRUNCM: string;
    NUMTRUNCD: string;
    EMPTYCMT: string;
    ALPHTONUM: string;
    KEEPDSIND: string;
    buttons?: string;
    SRCLIB?: string;
    SRCMBR?: string;
    SRCTYPE?: string;
    SRCFILE?: string;
    OBJTYPE?: string;
    TOSRCLIB?: string;
    TOSRCFILE?: string
    TOSRCMBR?: string;
}


export namespace ConfigManager {
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
        return getConfiguration().get<ConversionList[]>("conversionList", []);
    }

    export async function saveConversionList(list: ConversionList[]) {
        return getConfiguration().update('conversionList', list, ConfigurationTarget.Global);
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
}


export async function initializeConfiguration(): Promise<void> {
    const configKey = "arcad-transformer-rpg.command";
    const defaultConfig: CommandParams = {
        SRCLIB: "",
        SRCMBR: "",
        SRCTYPE: "",
        SRCFILE: "",
        CVTCLCSPEC: "*FREE",
        CVTDCLSPEC: "*YES",
        EXPCSPECPY: "*NO",
        FULLYFREE: "*YES",
        MAXNOTFREE: "*NONE",
        FIRSTCOL: 1,
        USEPARMNUM: "*NO",
        TOSRCFILE: "*NONE",
        TOSRCMBR: "*FROMMBR",
        TOSRCLIB: "",
        REPLACE: "*NO",
        CVT_CALL: "*YES",
        CVT_GOTO: "*ADVANCED",
        TAGFLDNAME: "ATag",
        CVT_KLIST: "*YES",
        CVT_MOVEA: "*ADVANCED",
        INDENT: 2,
        INDENTCMT: "*YES",
        OPCODECASE: "*MIXED",
        BLTFNCCASE: "*MIXED",
        SPCWRDCASE: "*MIXED",
        KEYWRDCASE: "*MIXED",
        FLGCVTTYPE: "*NO",
        CLRXREF: "*YES",
        CLRFRMCHG: "*YES",
        PRECPL: "*ARCAD",
        SRCDATE: "*CURRENT",
        CVT_SUBR: "*NO",
        CHECKIND: "*WNG1",
        SCANIND: "*WNG1",
        LOOKUPIND: "*WNG1",
        NUMTRUNCZ: "*YES",
        NUMTRUNCA: "*YES",
        NUMTRUNCB: "*NO",
        NUMTRUNCM: "*YES",
        NUMTRUNCD: "*YES",
        EMPTYCMT: "*KEEP",
        ALPHTONUM: "*YES",
        KEEPDSIND: "*NO"
    };

    const config = workspace.getConfiguration();
    const currentConfig = config.get<CommandParams>(configKey);

    if (!currentConfig || Object.keys(currentConfig).length === 0) {
        await config.update(configKey, defaultConfig, ConfigurationTarget.Global);
        tfrrpgOutput().appendLine(l10n.t("Default configuration set for ARCAD Transformer RPG."));
    } else {
        tfrrpgOutput().appendLine(l10n.t("Configuration already exists. Skipping default configuration initialization."));
    }
}


