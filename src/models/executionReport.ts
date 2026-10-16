import type { CommandResult } from "@halcyontech/vscode-ibmi-types";
import { SourceMember } from "./sourceMember";

export interface ExecutionReport {
    target: SourceMember
    result: CommandResult
}
