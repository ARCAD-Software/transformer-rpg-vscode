import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { Code4i } from "../platform/ibmi/code4i";
import { filterMembers } from "../utils/helper";
import { ConversionTarget } from "../models/conversionTarget";

export async function listConvertibleMembers(target: ConversionTarget): Promise<IBMiMember[]> {
  return (await Code4i.getContent().getMemberList({
    library: target.library,
    sourceFile: target.file,
    members: target.filter?.members,
    extensions: target.filter?.extensions,
    filterType: target.filter?.type
  })).filter(filterMembers);
}