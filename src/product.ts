import vscode, { l10n } from "vscode";
import { Code4i } from "./code4i";
import { ConfigManager } from "./configuration";
import { getARCADInstance } from "./extension";

async function readDataArea(library: string, name: string) {
  const [versionRow] = await Code4i.getConnection().runSQL(`Select DATA_AREA_VALUE From Table(QSYS2.DATA_AREA_INFO( DATA_AREA_NAME => '${name}', DATA_AREA_LIBRARY => '${library}'))`);
  return String(versionRow.DATA_AREA_VALUE).trim();
}

class TransformerRPGProduct {
  private loaded = false;
  private standaloneVersion = "";

  private arcadVersion = "";
  private arcadProductLibrary = "";
  private arcadCommandLibrary = "";

  async load(force?: boolean) {
    if (!this.loaded || force) {
      const checkCommand = (library: string) => Code4i.getContent().checkObject({ library, name: "ACVTRPGFRE", type: "*CMD" });
      if (await checkCommand(this.getStandaloneLibrary())) {
        this.standaloneVersion = await readDataArea(this.getStandaloneLibrary(), "ARCVERSION");
      }
      vscode.commands.executeCommand("setContext", "tfrrpgStandaloneInstalled", Boolean(this.standaloneVersion));

      const arcadProductLibrary = `ARC${getARCADInstance()}_PRD`;
      if (await Code4i.getContent().checkObject({ library: "QSYS", name: arcadProductLibrary, type: "*LIB" })) {
        try {
          this.arcadVersion = await readDataArea(arcadProductLibrary, "ARCVERSION");
          const checkARCADLanguage = (language: string) => checkCommand(`ARC${getARCADInstance()}_${language}`);
          if (await checkARCADLanguage("ENG")) {
            this.arcadCommandLibrary = `ARC${getARCADInstance()}_ENG`;
          }
          else if (await checkARCADLanguage("FRA")) {
            this.arcadCommandLibrary = `ARC${getARCADInstance()}_FRA`;
          }
          this.arcadProductLibrary = this.arcadCommandLibrary ? arcadProductLibrary : "";
        }
        catch (err: any) {
          console.log(err);
        }
      }

      this.loaded = true;
    }
  }

  clear() {
    this.loaded = false;
    this.standaloneVersion = "";
    this.arcadVersion = "";
    this.arcadProductLibrary = "";
    this.arcadCommandLibrary = "";
  }

  getStandaloneLibrary() {
    return "ARCAD_RPG";
  }

  getARCADCommandLibrary() {
    return this.arcadCommandLibrary;
  }

  getARCADProductLibrary() {
    return this.arcadProductLibrary;
  }

  async getProductLibrary() {
    await this.load();
    if (!this.arcadVersion || ConfigManager.forceStandaloneProduct()) {
      return this.getStandaloneLibrary();
    }
    else {
      return this.getARCADProductLibrary();
    }
  }

  getStandaloneVersion() {
    return this.standaloneVersion;
  }

  getARCADVersion() {
    return this.arcadVersion;
  }
}

export const product = new TransformerRPGProduct();

export function initializeProduct(context: vscode.ExtensionContext) {
  Code4i.subscribe(context,
    l10n.t("Clear ARCAD-Transformer RPG product information"),
    "disconnected",
    () => product.clear()
  );
}