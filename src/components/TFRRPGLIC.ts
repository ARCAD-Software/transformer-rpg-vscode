import { ComponentIdentification, ComponentState, IBMiComponent } from "@halcyontech/vscode-ibmi-types/api/components/component";
import IBMi from "@halcyontech/vscode-ibmi-types/api/IBMi";
import { posix } from "path";
import vscode, { l10n } from "vscode";
import { Code4i } from "../code4i";
import { getARCADInstance, tfrrpgOutput } from "../extension";

type Units = {
  total: number
  used: number
};

type Message = {
  id: string
  type: string
  text: string
  help: string
};

export type LicenseInformation = {
  message?: Message,
  serial: string
  lparId: number
  arcadVersion: string
  key?: string,
  permanentUnits?: Units
  temporaryUnits?: Units & {
    maxDate: string
  }
};

export class TransformerRPGLicense implements IBMiComponent {
  static ID = "TransformerRPGLicense";
  private readonly functionName = 'TFRRPGLIC';
  private readonly currentVersion = 2;

  private installedVersion = 0;
  private library = "";

  reset() {
    this.installedVersion = 0;
    this.library = "";
  }

  getIdentification(): ComponentIdentification {
    return { name: TransformerRPGLicense.ID, version: this.installedVersion };
  }

  async getRemoteState(connection: IBMi) {
    this.library = connection.getConfig().tempLibrary.toUpperCase() || "ILEDITOR";
    const [result] = await connection.runSQL(`select cast(LONG_COMMENT as VarChar(200)) LONG_COMMENT from qsys2.sysroutines where routine_schema = '${this.library}' and routine_name = '${this.functionName}'`);
    if (result?.LONG_COMMENT) {
      const comment = String(result.LONG_COMMENT);
      const dash = comment.indexOf('-');
      if (dash > -1) {
        this.installedVersion = Number(comment.substring(0, dash).trim());
      }
    }
    if (this.installedVersion < this.currentVersion) {
      return `NeedsUpdate`;
    }

    return `Installed`;
  }

  update(connection: IBMi): ComponentState | Promise<ComponentState> {
    return connection.withTempDirectory(async tempDir => {
      const tempSourcePath = posix.join(tempDir, `TFRRPGLIC.sql`);
      await connection.getContent().writeStreamfileRaw(tempSourcePath, this.getSource(), "utf-8");
      const result = await connection.runCommand({
        command: `RUNSQLSTM SRCSTMF('${tempSourcePath}') COMMIT(*NONE) NAMING(*SYS)`,
        noLibList: true
      });

      if (result.code) {
        return `Error`;
      } else {
        return `Installed`;
      }
    });
  }

  private getSource() {
    return `create or replace function ${this.library}/${this.functionName} (INSTANCE char(2), ACTION char(4), ACTIVATION_KEY char(16))
    RETURNS TABLE (
      MESSAGE_TYPE char(7),
      MESSAGE_ID char(7),
      MESSAGE_TEXT char(255),
      MESSAGE_HELP char(4000),
      SERIAL_NUMBER char(7),
      LPAR_ID INTEGER,
      ARCAD_VERSION char(8),
      KEY_SERIAL char(7),
      KEY_MAX_DATE char(10),
      KEY_PERMANENT_UNITS decimal(9, 0),
      KEY_TEMPORARY_UNITS decimal(9, 0),
      KEY_TYPE char(5),
      PERMANENT_UNITS decimal(9, 0),
      PERMANENT_UNITS_USED decimal(9, 0),
      TEMPORARY_UNITS decimal(9, 0),
      TEMPORARY_UNITS_USED decimal(9, 0),
      TEMPORARY_MAX_DATE char(10)
    )
    LANGUAGE SQL
    MODIFIES SQL DATA
    NOT DETERMINISTIC
    BEGIN ATOMIC
      Declare MESSAGE_TYPE char(7) default '';
      Declare MESSAGE_ID char(7) default '';
      Declare MESSAGE_TEXT char(255) default '';
      Declare MESSAGE_HELP char(4000) default '';
      Declare SERIAL_NUMBER char(7) default '';
      Declare LPAR_ID INTEGER default 0;
      Declare ARCAD_VERSION char(8) default '';
      Declare KEY_SERIAL char(7) default '';
      Declare KEY_MAX_DATE char(10) default '';
      Declare KEY_PERMANENT_UNITS decimal(9, 0) default 0;
      Declare KEY_TEMPORARY_UNITS decimal(9, 0) default 0;
      Declare KEY_TYPE char(5) default '';
      Declare PERMANENT_UNITS decimal(9, 0) default 0;
      Declare PERMANENT_UNITS_USED decimal(9, 0) default 0;
      Declare TEMPORARY_UNITS decimal(9, 0) default 0;
      Declare TEMPORARY_UNITS_USED decimal(9, 0) default 0;
      Declare TEMPORARY_MAX_DATE char(10) default '';
    
      Declare w_product_library char(10) default '';
    
      Declare continue handler FOR SQLSTATE '38501' Begin End;

      if Trim(INSTANCE) != '' Then
        set w_product_library = '*LIBL';
        call QCMDEXC('ADDLIBLE ARC' concat INSTANCE concat '_PRD');
        call QCMDEXC('ADDLIBLE ARC' concat INSTANCE concat '_ENG');
        call QCMDEXC('ADDLIBLE ARC' concat INSTANCE concat '_FRA');
      else
        set w_product_library = 'ARCAD_RPG';
        call QCMDEXC('ADDLIBLE ARCAD_RPG');
      End if;

      call AARF257G6(
        w_product_library, ACTION, ACTIVATION_KEY,
        MESSAGE_TYPE, MESSAGE_ID, MESSAGE_TEXT, MESSAGE_HELP,
        SERIAL_NUMBER, ARCAD_VERSION,
        KEY_SERIAL, KEY_MAX_DATE, KEY_PERMANENT_UNITS, KEY_TEMPORARY_UNITS, KEY_TYPE,
        PERMANENT_UNITS, PERMANENT_UNITS_USED,
        TEMPORARY_UNITS, TEMPORARY_UNITS_USED,
        TEMPORARY_MAX_DATE
      );

      select PARTITION_ID into LPAR_ID from table (QSYS2.SYSTEM_STATUS ());

      Return values (
        MESSAGE_TYPE,
        MESSAGE_ID,
        MESSAGE_TEXT,
        MESSAGE_HELP,
        SERIAL_NUMBER,
        LPAR_ID,
        ARCAD_VERSION,
        KEY_SERIAL,
        KEY_MAX_DATE,
        KEY_PERMANENT_UNITS,
        KEY_TEMPORARY_UNITS,
        KEY_TYPE,
        PERMANENT_UNITS,
        PERMANENT_UNITS_USED,
        TEMPORARY_UNITS,
        TEMPORARY_UNITS_USED,
        TEMPORARY_MAX_DATE
      );
    end;

    comment on function ${this.library}/${this.functionName} is '${this.currentVersion} - ARCAD Transformer RPG license program';
    
    call QSYS2.QCMDEXC( 'grtobjaut ${this.library}/${this.functionName} *SRVPGM *PUBLIC *ALL' );
    `;
  }

  async call(standalone: boolean, action: "CHK" | "ACT" | "USE", key: string = ""): Promise<LicenseInformation | undefined> {
    const instance = standalone ? "" : getARCADInstance();
    try {
      const [result] = await Code4i.getConnection().runSQL(`select * from table(${this.library}.${this.functionName}('${instance}', '*${action}', '${key}'))`);
      if (result) {
        const toNumber = (field: any) => field ? Number(field) : 0;
        const message: Message | undefined = result.MESSAGE_TEXT ? {
          id: result.MESSAGE_ID as string,
          type: result.MESSAGE_TYPE as string,
          text: result.MESSAGE_TEXT as string,
          help: (result.MESSAGE_HELP as string).replaceAll("&N", "\n")
        } : undefined;

        const permanentUnits: Units | undefined = {
          total: toNumber(result.PERMANENT_UNITS),
          used: toNumber(result.PERMANENT_UNITS_USED),
        };

        const temporaryUnits: Units & { maxDate: string } | undefined = {
          total: toNumber(result.TEMPORARY_UNITS),
          used: toNumber(result.TEMPORARY_UNITS_USED),
          maxDate: result.TEMPORARY_MAX_DATE as string,
        };

        return {
          message,
          serial: result.SERIAL_NUMBER as string,
          lparId: result.LPAR_ID as number,
          arcadVersion: result.ARCAD_VERSION as string,
          key: result.KEY_TYPE as string,
          permanentUnits,
          temporaryUnits
        };
      }
    }
    catch (error: any) {
      tfrrpgOutput().appendLine(l10n.t("Failed to call ARCAD-Transformer RPG license function: {0}", JSON.stringify(error)));
      vscode.window.showErrorMessage(l10n.t("Failed to call ARCAD-Transformer RPG license function"), l10n.t("Open output"))
        .then(open => {
          if (open) {
            tfrrpgOutput().show();
          }
        });

    }
  }
}