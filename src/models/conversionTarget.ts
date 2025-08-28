import { FilterType } from "@halcyontech/vscode-ibmi-types/api/Filter";

export type ConversionTarget = {
    library: string
    file: string
    member?: string
    extension?: string
    objectType?: string
    filter?: {
        members?: string
        extensions?: string
        type: FilterType
    }
};
