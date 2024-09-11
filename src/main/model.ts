import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { FilterType } from "@halcyontech/vscode-ibmi-types/api/Filter";


interface Connection {
    name: string;
    host: string;
    port: number;
    username: string;
}

export type Connections = Connection[];

export interface IMemberItem {
    member: IBMiMember;
    object: IBMiMember;
    path: string;
    parent: IMemberItem;
    contextValue: string;
    filter: Filter;
    sort: SortOptions;
}

export declare type SortOptions = {
    order: "name" | "date";
    ascending?: boolean;
};

export interface Filter {
    name: string
    library: string
    object: string
    types: string[]
    member: string
    memberType: string
    protected: boolean
    filterType: FilterType
}

