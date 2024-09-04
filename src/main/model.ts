import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { FilterType } from "@halcyontech/vscode-ibmi-types/api/Filter";

export interface MemberItem {
    member: IBMiMember;
    object: IBMiMember;
    path: string;
    parent: MemberItem;
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