import { ConversionStatus } from "./conversionStatus";
import { SourceMember } from "./sourceMember";


export type SourceMemberItem = SourceMember & {
    targetmember: string;
    status: ConversionStatus;
    message: string;
    date: Date | string;
};

export interface SourceMemberList {
    connectionname: string;
    listname: string;
    description: string;
    targetlibrary: string;
    targetsourcefile: string;
    items: SourceMemberItem[];
}

