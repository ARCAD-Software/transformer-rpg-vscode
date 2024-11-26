import { workspace, ConfigurationTarget } from 'vscode';
import { ConversionItem, ConversionList } from './main/views/conversionListBrowser';
import { Connections } from './main/model';
export interface CommandParams {
    SRCLIB: string;
    SRCMBR: string;
    SRCTYPE: string;
    SRCFILE: string;
    OBJTYPE: string;
    CVTCLCSPEC: string;
    CVTDCLSPEC: string;
    EXPCSPECPY: string;
    FULLYFREE: string;
    MAXNOTFREE: string;
    FIRSTCOL: number;
    USEPARMNUM: string;
    TOSRCFILE: string;
    TOSRCMBR: string;
    TOSRCLIB: string;
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
    buttons: string;
}


export namespace ConfigManager {
    export function getConfiguration() {
        return workspace.getConfiguration('arcad-transformer-rpg');
    }

    export function getParams(): CommandParams | undefined {
        const params = getConfiguration().get<CommandParams>('command');
        return params;
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

    export function setParams(params: CommandParams): Thenable<void> {
        return getConfiguration().update('command', params, ConfigurationTarget.Global);
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
                    targetmember: newItem.targetmember || ''
                };
            });
        }
    }

}
