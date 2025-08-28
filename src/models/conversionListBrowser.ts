import { ConversionStatus } from "../utils/messages";

export interface ConversionItem {
    targetmember: string;
    status: ConversionStatus;
    srctype: string;
    objtype: string;
    message: string;
    member: string;
    library: string;
    conversiondate: Date | string;
}

export interface ConversionList {
    connectionname: string;
    listname: string;
    description: string;
    targetlibrary: string;
    targetsourcefile: string;
    items: ConversionItem[];
}
