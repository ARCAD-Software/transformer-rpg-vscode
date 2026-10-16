import { commands } from "vscode";
import { COMMANDS } from "../../../utils/constants";
import { ExplorerNode } from "../common/explorerNode";

export function refreshListExplorer(node?: ExplorerNode): void {
  commands.executeCommand(COMMANDS.REFRESH_LIST, node);
}
