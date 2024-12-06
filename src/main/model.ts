import { FilterType } from "@halcyontech/vscode-ibmi-types/api/Filter";

interface Connection {
    name: string;
    host: string;
    port: number;
    username: string;
}

export type Connections = Connection[];

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