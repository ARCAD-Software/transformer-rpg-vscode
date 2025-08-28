import {
    ExtensionContext,
    commands,
    workspace,
    TreeView
} from 'vscode';

import { COMMANDS } from '../utils/constants';
import { handleMemberConvert } from './handlers/memberConvert';
import { ConversionListProvider } from '../ui/tree/conversion/provider';
import { ConversionListNode } from '../ui/tree/conversion/listNode';
import { ConversionItemNode } from '../ui/tree/conversion/itemNode';
import { ProductStatusDataProvider } from '../ui/tree/productstatus/productStatusProvider';
import { addMembersToConversionList } from './handlers/addMemberToList';

export function registerCommands(
    context: ExtensionContext,
    deps: {
        conversionProvider: ConversionListProvider;
        productProvider: ProductStatusDataProvider;
        productView: TreeView<any>;
    }
): void {

    const { conversionProvider, productProvider, productView } = deps;

    context.subscriptions.push(
        commands.registerCommand(COMMANDS.MEMBER_CONVERT, handleMemberConvert),
        commands.registerCommand(COMMANDS.ADD_MEMBER, addMembersToConversionList),
        commands.registerCommand(COMMANDS.ADD_MULTIPLE_MEMBERS, addMembersToConversionList),
        commands.registerCommand(COMMANDS.REFRESH_LIST, () => conversionProvider.refresh()),
        commands.registerCommand(COMMANDS.NEW_CONVERSION_LIST, () => conversionProvider.addNewConversionList()),
        commands.registerCommand(COMMANDS.DELETE_LIST, (node: ConversionListNode) => node.deleteConversionList(node)),
        commands.registerCommand(COMMANDS.DELETE_LIST_ITEM, (node: ConversionItemNode) => node.removeMemberFromList(node)),
        commands.registerCommand(COMMANDS.UPDATE_OBJECT_TYPE, (node: ConversionItemNode | ConversionListNode) => node.updateMemberObjectType()),
        commands.registerCommand(COMMANDS.EDIT_SOURCE, (node: ConversionItemNode) => node.editMember()),
        commands.registerCommand(COMMANDS.EDIT_CONVERTED_SOURCE, (node: ConversionItemNode) => node.editConvertedMember()),
        commands.registerCommand(COMMANDS.FOCUS_OBJECT_BROWSER, (node: ConversionListNode) => node.openIBMiObjectBrowser()),
        commands.registerCommand(COMMANDS.VIEW_PRODUCT_DESCRIPTION, (description: string) => productView.description = description),
        commands.registerCommand(COMMANDS.CONVERT_TARGET_MEMBER, (node: ConversionItemNode | ConversionListNode) => {
            node instanceof ConversionItemNode ? node.startSingleItemConversion() : node.processBatchConversion();
        }),

        workspace.onDidChangeConfiguration(change => {
            if (['arcad.connection.instance', 'arcad-transformer-rpg.forceUseOfStandaloneProduct']
                .some(conf => change.affectsConfiguration(conf))) {
                productProvider.refresh();
            }
        })
    );
}