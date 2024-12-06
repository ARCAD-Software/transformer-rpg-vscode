import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { Code4i } from "../code4i";
import { filterMembers } from "../utils/helper";
import { ConversionTarget } from "./model";

export async function listObjects(library: string) {
  const rows = await Code4i.getConnection().runSQL(`select OBJNAME, OBJTYPE from table (QSYS2.OBJECT_STATISTICS('${library}','PGM MODULE','*ALL'))`);
  if (rows) {
    return rows.reduce((map, row) => map.set(String(row.OBJNAME), String(row.OBJTYPE)), new Map<string, string>());
  }
}

export async function getObjectType(library: string, name: string) {
  const [row] = await Code4i.getConnection().runSQL(`select OBJTYPE from table (QSYS2.OBJECT_STATISTICS('${library}','PGM MODULE','${name}'))`);
  return row && row.OBJTYPE ? String(row.OBJTYPE) : undefined;
}

export async function findObjectType(library: string, name: string, cache?: Map<string, string>) {
  const libraries = [library, ...(Code4i.getConnection().config?.libraryList || []).filter(l => l !== library)];
  const cachedType = cache?.get(name);
  if (cachedType) {
    return cachedType;
  }
  for (const library of libraries) {
    const type = await getObjectType(library, name);
    if (type) {
      return type;
    }
  }
  return "*NONE";
};

export async function listConvertibleMembers(target: ConversionTarget): Promise<IBMiMember[]> {
  return (await Code4i.getContent().getMemberList({
    library: target.library,
    sourceFile: target.file,
    members: target.filter?.members,
    extensions: target.filter?.extensions,
    filterType: target.filter?.type
  })).filter(filterMembers);
}