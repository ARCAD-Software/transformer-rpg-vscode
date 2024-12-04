import { posix } from "path";
import vscode, { l10n } from "vscode";
import { Code4i } from "./code4i";
import { TransformerRPGLicense } from "./components/TFRRPGLIC";
import { ConfigManager } from "./configuration";
import { getARCADInstance, tfrrpgOutput } from "./extension";

async function readDataArea(library: string, name: string) {
  const [versionRow] = await Code4i.getConnection().runSQL(`Select DATA_AREA_VALUE From Table(QSYS2.DATA_AREA_INFO( DATA_AREA_NAME => '${name}', DATA_AREA_LIBRARY => '${library}'))`);
  return String(versionRow.DATA_AREA_VALUE).trim();
}

export const tfrrpgLanguages = {
  ENG: l10n.t("English"),
  FRA: l10n.t("French"),
  JPN: l10n.t("Japanese"),
  GER: l10n.t("German")
};

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
          tfrrpgOutput().appendLine(l10n.t("Error occurred while ARCAD runtime information: {0}", JSON.stringify(err)));
        }
      }
      vscode.commands.executeCommand("tfrrpg-product-view-description", this.isInstalled() ? (this.isStandalone() ? l10n.t("Standalone mode") : "") : l10n.t("Not installed"));
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

  isInstalled() {
    return this.getARCADVersion() || this.getStandaloneVersion();
  }

  isStandalone() {
    return !Boolean(this.arcadVersion) || ConfigManager.forceStandaloneProduct();
  }

  async getProductLibrary() {
    await this.load();
    if (this.isStandalone()) {
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

  private getLicenseProgram() {
    return Code4i.getConnection().getComponent<TransformerRPGLicense>(TransformerRPGLicense.ID);
  }

  getCurrentLicense() {
    return this.getLicenseProgram().call(this.isStandalone(), "USE");
  }

  applyLicense(key: string, checkonly?: boolean) {
    return this.getLicenseProgram().call(this.isStandalone(), checkonly ? "CHK" : "ACT", key);
  }

  changeLanguage(language: string) {
    return Code4i.getConnection().runCommand({ command: `ARCAD_RPG/ALICCVTRPG ACTION(*LNG) LANGID(${language})`, noLibList: true });
  }

  async install(installPackage: vscode.Uri) {
    return vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, cancellable: false, title: this.standaloneVersion ? l10n.t("Updating runtime") : l10n.t("Installing runtime") },
      progress => {
        const connection = Code4i.getConnection();
        return connection.withTempDirectory(async directory => {
          const workFile = "ARCAD_RPGS";
          const workLibrary = connection.config?.tempLibrary || "ILEDITOR";
          const runCommand = async (command: string) => connection.runCommand({ command, noLibList: true });
          const clearSAVF = () => connection.content.checkObject({ library: workLibrary, name: workFile, type: "*FILE" })
            .then(exists => exists ? runCommand(`DLTF FILE(${workLibrary}/${workFile})`) : undefined);

          try {
            progress.report({ message: l10n.t("uploading update package...") });
            const streamfile = posix.join(directory, "tfrrpg.savf");
            await connection.uploadFiles([{ local: installPackage, remote: streamfile }]);

            progress.report({ message: l10n.t("restoring save file object...") });
            const clearResult = await clearSAVF();
            if (clearResult?.code) {
              throw l10n.t("Could not delete save file {0}/{1}: {2}", workLibrary, workFile, clearResult.stderr || clearResult.stdout);
            }

            const crtsavf = await runCommand(`CRTSAVF FILE(${workLibrary}/${workFile}) TEXT('ARCAD-Transformer RPG update')`);
            if (crtsavf?.code) {
              throw l10n.t("Could not create save file {0}/{1}: {2}", workLibrary, workFile, crtsavf.stderr || crtsavf.stdout);
            }

            const cpyfrmstmf = await runCommand(`CPYFRMSTMF FROMSTMF('${streamfile}') TOMBR('/QSYS.LIB/${workLibrary}.LIB/${workFile}.FILE') MBROPT(*REPLACE)`);
            if (cpyfrmstmf?.code) {
              throw l10n.t("Could not restore {0}/{1} from streamfile: {2}", workLibrary, workFile, cpyfrmstmf.stderr || cpyfrmstmf.stdout);
            }

            progress.report({ message: l10n.t("restoring ARCAD_RPG library...") });
            const restoreLibrary = await runCommand(`RSTLIB SAVLIB(ARCAD_RPGD) RSTLIB(ARCAD_RPG) DEV(*SAVF) SAVF(${workLibrary}/${workFile}) MBROPT(*ALL) ALWOBJDIF(*ALL)`);
            let failed = restoreLibrary?.code !== 0;
            if (failed) {
              const messages = Code4i.getTools().parseMessages(restoreLibrary.stderr || restoreLibrary.stdout);
              const maybeOK = messages.findId("CPF3773");
              if(maybeOK){
                const notRestored = Number(/^(\d+) .+ (\d+) .*$/.exec(maybeOK.text)?.at(2));
                failed = notRestored !== 0;
              }              
            }

            if(failed){
              throw l10n.t("Could not restore ARCAD_RPG library: {0}", restoreLibrary.stderr || restoreLibrary.stdout);
            }

            return true;
          }
          catch (error: any) {
            tfrrpgOutput().appendLine(l10n.t("Error occurred while updating standalone runtime: {0}", JSON.stringify(error)));
            vscode.window.showErrorMessage(l10n.t("Could not update ARCAD Transformer RPG standalone runtime"), l10n.t("Open output"))
              .then(open => {
                if (open) {
                  tfrrpgOutput().show();
                }
              });
            return false;
          }
          finally {
            await clearSAVF();
          }
        });
      });
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