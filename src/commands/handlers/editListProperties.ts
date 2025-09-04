import { l10n, window } from "vscode";
import { ConversionListNode } from "../../ui/tree/conversion/listNode";
import { ConversionListItemStepper } from "../../ui/inputs/conversionListStepper";
import { ConfigManager } from "../../config/configuration";
import { refreshListExplorer } from "../../extension";

export async function handleEditListProperties(node: ConversionListNode): Promise<void> {
    if (!node.conversionList) {
        window.showErrorMessage(l10n.t('Unable to edit list properties: conversion list data not available.'));
        return;
    }

    try {
        const updatedList = await ConversionListItemStepper(node.conversionList);
        if (!updatedList) {
            return;
        }
        await ConfigManager.updateConversionList(updatedList);
        refreshListExplorer();

        window.showInformationMessage(
            l10n.t('Conversion list "{0}" properties updated successfully.', updatedList.listname)
        );

    } catch (error) {
        window.showErrorMessage(
            l10n.t('Failed to update conversion list properties: {0}',
                error instanceof Error ? error.message : String(error))
        );
    }
}
