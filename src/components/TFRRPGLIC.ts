import { ComponentIdentification, ComponentState, IBMiComponent } from "@halcyontech/vscode-ibmi-types/components/component";
import { posix } from "path";

export class TransformerRPGLicense implements IBMiComponent {
  static ID = "TransformerRPGLicense";
  private readonly functionName = 'TFRRPGLIC';
  private readonly currentVersion = 1;
  private installedVersion = 0;

  getIdentification(): ComponentIdentification {
    return { name: TransformerRPGLicense.ID, version: this.installedVersion };
  }

  async getRemoteState() {
    const [result] = await this.connection.runSQL(`select LONG_COMMENT from qsys2.sysroutines where routine_schema = '${this.connection.config?.tempLibrary.toUpperCase()}' and routine_name = '${this.functionName}'`);
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

  update(): ComponentState | Promise<ComponentState> {
    const config = this.connection.config!;
    return this.connection.withTempDirectory(async tempDir => {
      const tempSourcePath = posix.join(tempDir, `TFRRPGLIC.sql`);
      await this.connection.content.writeStreamfileRaw(tempSourcePath, Buffer.from(this.getSource(config.tempLibrary), "utf-8"));
      const result = await this.connection.runCommand({
        command: `RUNSQLSTM SRCSTMF('${tempSourcePath}') COMMIT(*NONE) NAMING(*SQL)`,
        noLibList: true
      });

      if (result.code) {
        return `Error`;
      } else {
        return `Installed`;
      }
    });
  }

  private getSource(library: string) {
    return `create or replace function ${library}.${this.functionName} (INSTANCE char(2), ACTION char(4), ACTIVATION_KEY char(16))
    RETURNS TABLE (
      MESSAGE_TYPE char(7),
      MESSAGE_ID char(7),
      MESSAGE_TEXT char(255),
      MESSAGE_HELP char(4000),
      SERIAL_NUMBER char(7),
      ARCAD_VERSION char(8),
      KEY_SERIAL char(7),
      KEY_MAX_DATE char(10),
      KEY_PERMANENT_UNITS decimal(9,0),
      KEY_TEMPORARY_UNITS decimal(9,0),
      KEY_TYPE char(5),
      PERMANENT_UNITS decimal(9,0),
      PERMANENT_UNITS_USED decimal(9,0),
      TEMPORARY_UNITS decimal(9,0),
      TEMPORARY_UNITS_USED decimal(9,0),
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
      Declare ARCAD_VERSION char(8) default '';
      Declare KEY_SERIAL char(7) default '';
      Declare KEY_MAX_DATE char(10) default '';
      Declare KEY_PERMANENT_UNITS decimal(9,0) default 0;
      Declare KEY_TEMPORARY_UNITS decimal(9,0) default 0;
      Declare KEY_TYPE char(5) default '';
      Declare PERMANENT_UNITS decimal(9,0) default 0;
      Declare PERMANENT_UNITS_USED decimal(9,0) default 0;
      Declare TEMPORARY_UNITS decimal(9,0) default 0;
      Declare TEMPORARY_UNITS_USED decimal(9,0) default 0;
      Declare TEMPORARY_MAX_DATE char(10) default '';
    
      Declare w_target_library char(10) default '';
      Declare w_product_library char(10) default '';
    
      Declare w_command char(10) default '';  
      Declare w_addlibfailed integer default 0;
      DECLARE CALL_FAILED CONDITION FOR SQLSTATE '38501';
    
      Declare continue handler for CALL_FAILED
      Begin
        If w_command = 'ADDLIBLE' Then
          set w_addlibfailed = 1;
        End If;
      End;
    
      if Trim(INSTANCE) != '' Then
        set w_target_library = 'ARC' concat INSTANCE concat '_PRD';
        set w_product_library = '*LIBL';
      else
        set w_target_library = 'ARCAD_RPG';
        set w_product_library = w_target_library;
      End if;
    
      set w_command = 'ADDLIBLE';
      call QCMDEXC('ADDLIBLE ' concat w_target_library);
    
      set w_command = 'AARF257G6';
      call AARF257G6(
        w_product_library, ACTION, ACTIVATION_KEY,
        MESSAGE_TYPE, MESSAGE_ID, MESSAGE_TEXT, MESSAGE_HELP,
        SERIAL_NUMBER, ARCAD_VERSION,
        KEY_SERIAL, KEY_MAX_DATE, KEY_PERMANENT_UNITS, KEY_TEMPORARY_UNITS, KEY_TYPE,
        PERMANENT_UNITS, PERMANENT_UNITS_USED,
        TEMPORARY_UNITS, TEMPORARY_UNITS_USED,
        TEMPORARY_MAX_DATE
      );
    
      If w_addlibfailed = 0 Then
        set w_command = 'RMVLIBLE';
        call QCMDEXC('RMVLIBLE ' concat w_target_library);
      End If;
    
      Return values (
        MESSAGE_TYPE,
        MESSAGE_ID,
        MESSAGE_TEXT,
        MESSAGE_HELP,
        SERIAL_NUMBER,
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

    comment on function ${library}.${this.functionName} is '${this.currentVersion} - ARCAD Transformer RPG license program';
    
    call QSYS2.QCMDEXC( 'grtobjaut ${library}/${this.functionName} *SRVPGM *PUBLIC *ALL' );
    `;
  }
}