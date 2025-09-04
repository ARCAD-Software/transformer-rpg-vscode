import type { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { Code4i } from "../platform/ibmi/code4i";
import { filterMembers } from "../utils/helper";
import { SourceMember } from "../models/conversionTarget";

export async function listConvertibleMembers(target: SourceMember): Promise<IBMiMember[]> {
  return (await Code4i.getContent().getMemberList({
    library: target.library,
    sourceFile: target.file,
  })).filter(filterMembers);
}