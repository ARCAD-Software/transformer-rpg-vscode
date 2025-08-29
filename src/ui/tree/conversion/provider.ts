
import vscode from "vscode";
import { ConfigManager } from "../../../config/configuration";
import { ConversionListNode } from "./listNode";
import { NoListItem } from "./noListNode";
import { ConversionListItemStepper } from "../../inputs/conversionListStepper";
import { ExplorerDataProvider } from "../common/provider";


export class ConversionListProvider extends ExplorerDataProvider {
    async getRootNodes() {
        const lists = await ConfigManager.getConversionList();
        if (lists.length) {
            return lists.map((list) => new ConversionListNode(list));
        } else {
            return [new NoListItem()];
        }
    }

    public addNewConversionList(): Promise<boolean> {
        return new Promise((resolve) => {
            ConversionListItemStepper().then(async (item) => {
                if (item) {
                    ConfigManager.addConversionList(item).then(() => {
                        vscode.window.showInformationMessage(vscode.l10n.t(`Conversion list {0} added successfully.`, item.listname));
                        this.refresh();
                        resolve(true);
                    });
                } else {
                    resolve(false);
                }
            });
        });
    }
}
