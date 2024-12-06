import { IBMiMember } from "@halcyontech/vscode-ibmi-types";
import { Code4i } from "../code4i";
import { filterMembers } from "../utils/helper";
import { ConversionTarget } from "./model";

function getLibraryList(mainLibrary: string) {
  return [mainLibrary, ...(Code4i.getConnection().config?.libraryList || []).filter(library => library !== mainLibrary)];
}

async function listObjects(library: string) {
  const rows = await Code4i.getConnection().runSQL(`select OBJNAME, OBJTYPE from table (QSYS2.OBJECT_STATISTICS('${library}','PGM MODULE','*ALL'))`);
  if (rows) {
    return rows.reduce((map, row) => map.set(String(row.OBJNAME), String(row.OBJTYPE)), new Map<string, string>());
  }
}

export async function getObjectType(library: string, name: string) {
  for (const lib of getLibraryList(library)) {
    const [row] = await Code4i.getConnection().runSQL(`select OBJTYPE from table (QSYS2.OBJECT_STATISTICS('${lib}','PGM MODULE','${name}'))`);
    return row && row.OBJTYPE ? String(row.OBJTYPE) : undefined;
  }
}

export async function findObjectType(memberLibrary: string, name: string, librariesCache: Map<string, Map<string, string>>) {
  const libraries = getLibraryList(memberLibrary);

  //Check cache first
  if (librariesCache) {
    for (const cache of librariesCache.values()) {
      const cachedType = cache.get(name);
      if (cachedType) {
        return cachedType;
      }
    }
  }

  for (const library of libraries) {
    if (!librariesCache || !librariesCache.has(library)) {
      const types = await listObjects(library);
      if (types) {
        librariesCache?.set(library, types);

        const type = types.get(name);
        if (type) {
          return type;
        }
      }
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