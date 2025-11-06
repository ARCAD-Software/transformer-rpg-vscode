import type { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { Code4i } from "../platform/ibmi/code4i";
import { filterMembers } from "../utils/helper";
export type MemberListParam = {
  library: string;
  sourceFile: string;
};
export async function listConvertibleMembers(param: MemberListParam): Promise<IBMiMember[]> {
  return (await Code4i.getContent().getMemberList(param)).filter(filterMembers);
}