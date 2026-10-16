export const COMMAND_HELP_TEXT: Record<string, string> = {
  OBJTYPE: `For the conversion of calculation specifications (C), this parameter indicates whether the object directly created from this source is a *MODULE or *PGM, this information is required when converting to Free syntax for conversion of an "*ENTRY PLIST ...".
However, for the conversion of the declaration specifications only, the value *NONE allows the normal preliminary compilation to be omitted. (useful particularly for COPY clauses).
---
The possible values are as follows:

## *PGM
For Free, the prototype for the input parameters of this program will have the EXTPGM keyword.

## *MODULE
For Free, the prototype for the input parameters of this module will not have the EXTPGM keyword.

## *NONE
No object type is associated with this source; this value can only be used if you are converting only the declaration specifications (H, F, D, P). It is not allowed if you want to convert the calculation specifications (C).`,

  CVTCLCSPEC: `Specifies whether you want to convert the syntax for RPGLE and SQLRPGLE calculation specifications (C).
---
The possible values are as follows:

## *FREE
All calculation instructions RPGLE (with some exceptions) are converted into Free syntax.

## *CHECK
The source to be converted is analyzed to detect potential risks of truncation for numeric fields, but no conversion is performed. The usage count (linked to the product license) is not incremented.
Any warnings issued can be listed and managed via the ARCAD Transformer PlugIn, before execution of the official source conversion.

## *FREECHECK
This option combines the *CHECK and *FREE parameter values (explained above).
- If at least one warning is issued indicating a risk of numeric field truncation, the conversion is not performed.
- If no warnings are issued, then the official conversion is done.

## *NO
No RPGLE syntax conversion is performed for the calculation specifications.

## *EXTFACT2
When possible, old operation codes, using the factor 1, factor 2 and result are converted to instructions using extended factor 2.`,

  CVTDCLSPEC: `Specify if you wish to convert the syntax of the declaration specifications (H, F, D and P) for the RPGLE and SQLRPGLE.
---
The possible values are as follows:

## *YES
All declaration specifications in RPGLE (with some exceptions) are converted to Free syntax.
In addition, clauses "C/Free" and "/End-Free" are all deleted.
Note: NOTE: This new syntax option is only available in V7R1M0, with the installation of PTF Group "Technology Refresh 7". If you do not have this option at your RPGLE or SQLRPGLE compiler level, the conversion is not allowed.
In the following cases, the conversion of a declaration specification is not done because there is no equivalent declaration in Free syntax:
- in F specifications (pos. 18), use of a "File Designation" having the value P=Primary, S=Secondary, T=Array or Table, R=Address.
- in F specifications (pos. 19), use of "End of File"
- in F specifications (pos. 21), use of "Sequence"
- in F specifications (pos. 28), use of "Limits Processing"
- in F specifications (pos. 34), value of "Record Address Type" not blank and not 'A'.
- in F specifications (pos. 35), value of 'T' (Record Address File) for the "File Organization"
- in D specifications, use of keywords FROMFILE or TOFILE for the field names.
For an F specification using an output file with add (O in pos. 17, A in position 20), the conversion includes the removal of the ADD keyword in the O specification.
In addition, the conversion of a declaration specification is not done in the following case:
- use of a variable or procedure whose name excedes 99 characters
For a COPY clause the following rule is applied:
- If it only contains DS subfields, no 'End-Ds' is added at the end.
- In all other cases, an 'End-Ds' is added to the end. You must manually intervene for source lines that use the COPY clause, if the DS continues on lines that follow the /COPY.

## *NO
The declaration specifications (H, F, D and P) remain in classic syntax.`,

  FULLYFREE: `Specifies whether to convert the source member to "Fully-Free"; in this case, the source lines can occupy all the columns, from the first column, up to the source file record length.
---
Note: ATTENTION, this new syntax option is only available from system version V7R2M0, via the installation of the "Technology Refresh 3" PTF group (IBM i 7.2 TR 3). It is also available in "Technology Refresh 11" (IBM i 7.1 TR 11) V7R1.
If you do not have this for your RPGLE ou SQLRPGLE compiler level, the conversion will not be allowed.
This option is normally enabled by also requesting the complete conversion of the calculation specifications as well as the declaration specifications.
However, if your source is already completely in Free syntax (using columns 8 to 80), but not Fully-Free, it is possible to perform just a simple conversion to "Fully-Free" format, freely, without any check or use of Transformer RPG product licenses. If your source still has comments with '*' in colum 7, it is accepted and these are converted to Free syntax ('//').
For this, the conversion must be started with the following parameters:
- OBJTYPE(*NONE) Type of object
- CVTCLCSPEC(*NO) Convert calculation specs.
- CVTDCLSPEC(*NO) Convert declaration specs.
- FULLYFREE(*YES) Convert to "Fully-Free"
- MAXNOTFREE(*NONE) Max nbr of not "Free" blocks
The possible values are as follows:

## *NO
The conversion to "Fully-Free" syntax is not done.

## *YES
The source is converted to Fully-Free:
- the special **FREE directive is added as the first line
- the lines of code are shifted to the left (see parameter FIRSTCOL)
- if you want to keep the comments that are in columns 1-5 specify FLGCVTTYPE(*KEEP), these are then moved to the end of the line.
- Of course, the data lines for the compile time arrays and tables at the end of the compilation source, after the "** " or **CTDATA directives are not affected by these modifications.
Normally, the conversion to "Fully-Free" will not be done unless all the source lines can be converted to Free syntax. (see parameter MAXNOTFREE)`,

  TOSRCFILE: `Specify the name of the destination source file and library, receiving the converted source member.
You must have sufficient rights for the destination source file.
---
The possible values are as follows:

## *NONE
No source member is generated as output; in this case, remember to specify parameter CLRFRMCHG(*NO), in order to see the new source lines in file AARFCHSF1.

## *FROMFILE
The destination library and source file are the same as the source file of the member to be converted; in this case, you must specify a different member name.

## Name of the source file
Specify a name and a library for the destination source file.
If the destination library is QTEMP, the source file will be created with the same attributes as the origin source file. See also parameter BATCHQTEMP to authorize QTEMP in batch mode.
If the destination library is not QTEMP, the source file must already exist.`,

  TOSRCMBR: `Specify the destination source member, if you have specified a destination source file.
---
The possible values are as follows:

## *FROMMBR
The destination source member has the same name as the source member analyzed. In this case, it cannot be in the same source file (in the same library).

## Nom de membre
Specify the member name receiving the converted source`,

  REPLACE: `If you have specified a destination file and source member that already exists, specify here whether the contents should be replaced.
---
The possible values are as follows:

## *NO
The conversion is not done if the destination source member already exists.

## *YES
The contents of the destination source member are replaced by the converted source.`,

  EXPCSPECPY: `When source members are included in the source to be converted via the /COPY or /INCLUDE clauses, they are not converted to Free syntax.
If these included source members only contain declarative specifications (H, F, D, P), they can be converted autonomously. However, if these included source members contain calculation specifications (C), they cannot be converted autonomously because their compilation would fail.
---
This parameter allows, when necessary, the creation of an intermediate source containing the source lines of these included members, so that these lines are also converted; then you can transfer them to a source member.
The possible values are as follows:

## *NO
No intermediate source is created before conversion. The content of the /COPY or /INCLUDE clauses is not converted.

## *YES
When /COPY or /INCLUDE clauses are found in the source to be analyzed, a preliminary study is carried out to know if the source lines to be included contain "C" specifications in classical syntax and whether they are active (not just comments).
If at least one case is found, an intermediate source is created in source file QTEMP/ZZEXPCCPY; in this source, the lines of the relevant COPY clauses are "extended" and "wrapped" by:
- the COPY clause line changed to a comment
- comments indicating the start and end of the inclusion.
Example :

@code
  C*  /COPY RPGLE751C
  C*===== Begin of Copy source : APPSRCLIB1/QRPGLESRC member RPGLE751C level 1
   ...
  C*===== End of Copy source : APPSRCLIB1/QRPGLESRC member RPGLE751C level 1
@end
In the converted source, you can extract the converted lines for the included member to a source member, then reactivate the /COPY clause.
However, please note that variable declarations or program prototypes can result from converting these lines; you can also externalize them, but in another new COPY clause.
Note: In principle, a COPY clause source member will only be converted when you convert a primary source that includes it. If you successfully put a COPY clause in this source, then the conversion of other sources that also include it will not require this mechanism.`,

  CVT_CALL: `Specify if you wish to convert to Free syntax all traditional program calls (CALL) or procedure calls (CALLB), along with the entry/exit parameter declarations via *ENTRY PLIST.
---
For this the prototypes are created in the D-specs for each different program or procedure call (or if the parameter types/lengths are different); the name of the prototype starts 'Pgm_' if it's for a program and 'Prc_' if it's for a procedure.
After that, each "traditional" call is replaced by a prototyped call, with the parameters that were specified with PARM.
For the parameters of the source itself (that were on the *ENTRY PLIST), a procedure interface (Pi) is also created; it takes the same name for the variables that were specified in PARM statements.
It may be that these variables are already defined in D-specs as well: in which case, their previous definition is deleted (except if they are in a COPY clause, which will cause an error when compiling the new source).
However, there is a special case when the variable in PARM is a DS: in this case another variable "ds_PiParm_nnn" is defined in the procedure interface, and the DS points to it via pointer "pds_PiParm_nnn" set at the start of the program.
But if this DS is not defined in the main source part of the program, because it is in a COPY clause, this modification can't be done automatically. In this case, "eval" instructions between the "ds_PiParm_nnn" parameter and the DS are added at the beginning of the program instructions, and also at the end of the program (implicit end or using the RETURN instruction). It will be ok when this DS has no dimension, or when it's an array (Dim(...)); However, if this DS has a multiple occurrence (Occurs(...)), , the compilation will fail, and you need to do a manual adaptation.
If factors 1 and 2 were used for the PARM, then assignment instructions are added before/after the CALL or at the start and/or end of execution (for *ENTRY PLIST), if the execution is terminated with RETURN instructions assignment instructions will be inserted where necessary.
If PLIST / PARM statements are defined, they are deleted.
The possible values are as follows:

## *YES
CALL / CALLB instructions are replaced by prototyped calls. If *ENTRY PLIST is used, the program itself is prototyped.
Note: When an indicator "LR" (position 75-76) was defined on the CALL/CALLB instruction, it was rarely voluntary: in that case, the following warning is inserted in the source, but the conversion is done, without managing this indicator:

@code
// *CVTWNG - The *INxx indicator was defined on column 75-76 for the CALL: Removed.
@end
Just the following cases prevent the replacement of CALL / CALLB with prototyped calls:
- A PLIST is used in a COPY clause.
- An *ENTRY PLIST contains a field declared with SQLTYPE(BLOB, CLOB, DBCLOB).

## *NO
All CALL, CALLB, PLIST, PARM instructions remain in traditional syntax.`,

  CVT_GOTO: `Traditional branching opcodes GOTO / TAG / CABxx have no exact equivalent in Free syntax; normally it is necessary to restructure the code in order to transform it to structured programming.
However, the ACVTRPGFRE command allows the possibility to remove almost all these branching instructions in certain cases:
---
- When possible, using LEAVESR, LEAVE, ITER.
- By simulating the branching management in structured programming via the introduction of a variable containing the old label.
Of course, the structure of your program cannot be redesigned automatically, but this has the advantage of converting almost everything to Free syntax.
However, the following cases always stay in traditional syntax, with GOTO/TAG:
- Branching from a subroutine to a label situated in the main body of the program (or procedure).
- Branching not respecting the nesting of structured programming (from outside of a loop or test/compare to within it).
Example :

@code
          If     Cdt1
          Goto   Act02
          Endif
          ...
          If     Cdt2
  Act02   Tag
          ...
          EndIf
@end
- In SQLRPGLE, branching made in an SQL instruction "WHENEVER ... GO TO label"
- Branching in the analyzed source to a label defined in a COPY clause.
- Branching from a COPY clause to a label defined in the analyzed source.
- Branching to a label that is not situated at the same control-level indicator level L0, L1..L9, LR (or later).
- Branching done inner a block of lines surrounded by conditional compilation directives (/IF ... /ENDIF)
The possible values are as follows:

## *ADVANCED
In addition to the base case (see *BASE), replacing most of the branching by structured programming tests, with the help of a variable containing the label name, and conditioning lines of code to get to the place where the label was defined.
Example 1 - Branching to labels situated later in the code.
Before:

@code
  C                   If           Cdt2
  C                   Goto         TRT02
  C                   EndIf
  C                   If           Cdt1
  C                   Goto         Trt01
  C                   EndIf
  C                   Eval         X = 0
   ...
  C        TRT01      Tag
  C                   Eval         X = 1
   ...
  C        TRT02      Tag
  C                   Eval         X = 2
  C                   ...
@end
After:

@code
     If Cdt2;
       ATag = 'TRT02';
     EndIf;
     If ATag = *Blanks;
       If Cdt1;
         ATag = 'TRT01';
       EndIf;
     EndIf;
     If ATag = *Blanks;
       X = 0;
       ...
     EndIf;
     If ATag = 'TRT01' or ATag = *blanks;
       ATag = *Blanks;
       X = 1;
       ...
     EndIf;
     // branch when ATag = 'TRT02'
     ATag = *Blanks;
     X = 2;
     ...
@end
When the label is situated earlier in the code, an instruction is inserted allowing it to loop back (DoU).
Example 2 - Branching to labels situated previously in the code.
Before:

@code
  C                   If           Cdt3
  C                   Goto         TRT03
  C                   EndIf
  C        TRT00      Tag
  C                   If           Cdt1
  C                   Goto         Trt01
  C                   EndIf
  C                   Eval         X = 0
   ...
  C        TRT01      Tag
  C                   Eval         X = 1
   ...
  C        TRT02      Tag
  C                   Eval         X = 2
  C                   If           Cdt0
  C                   Goto         TRT00           <===
  C                   EndIf
  C                   ...
   ...
  C        TRT03      Tag
  C                   Eval         X = 3
  C                   If           Cdt2
  C                   Goto         TRT02           <===
  C                   EndIf
  C                   ...
@end
After:

@code
     If Cdt3;
       ATag = 'TRT03';
     EndIf;
     DoU ATag <> 'TRT00' and ATag <> 'TRT01'
       If ATag = 'TRT00' or ATag = *blanks;
         ATag = *Blanks;
         If Cdt1;
           ATag = 'TRT01';
         EndIf;
       EndIf;
       If ATag = *Blanks;
         X = 0;
         ...
       EndIf;
       If ATag = 'TRT01' or ATag = *blanks;
         ATag = *Blanks;
         X = 1;
         ...
       EndIf;
       If ATag = 'TRT02' or ATag = *blanks;
         ATag = *Blanks;
         X = 2;
         If Cdt0;
           ATag = 'TRT00';
           Iter;                      <===
         EndIf;
         ...
       EndIf;
       // branch when ATag = 'TRT03'
       ATag = *Blanks;
       X = 3;
       If Cdt2;
         ATag = 'TRT02';
         Iter;                        <===
       EndIf;
       ...
    EndDo;
@end
For more complex cases (branching and labels situated at different DOxxx/FOR loop levels; existence of LEAVE/ITER instructions at the location where 'DoU' instructions are inserted to loop back in the code; etc.), this management sometimes requires:
- the setting of the variable ATag with values '*LEAVE' or '*ITER',
- a request to exit from a loop-level with LEAVE,
- a comparison/test of values in the loop variable after the end of a loop, to loop-back or exit again to another loop-level

## *BASE
Only branching operations that can be done directly in structured programming are modified:
- Branching to a label situated on an ENDSR instruction: replaced by LEAVESR.
- Branching to a label defined by a TAG situated just before the ENDSR instruction: replaced by LEAVESR.
- Branching to a label situated just before an unconditioned end-of-loop (ENDDO/ENDFOR): replaced by ITER.
- Branching to a label situated just after an end-of-loop (ENDDO/ENDFOR) : replaced by LEAVE.
- Unnecessary branching (GOTO) instructions to labels that are located immediately afterwards are deleted.
- Unused labels (TAG) are deleted.

## *NO
- All GOTO/TAG instructions remain in traditional syntax.
- ENDSR instructions with a label are split into 2 instructions (a TAG remaining in traditional syntax and an ENDSR transformed to Free syntax).
- CABxx instructions with a label are split into several instructions (test/comparison, management of any indicators, and a GOTO which remains in traditional syntax).`,

  TAGFLDNAME: `If you request the conversion of branching in "complete" mode (*ADVANCED), specify here the name of a new variable that will be created (if necessary) in the source, to memorize and test for the old label name.
---
You can specify the name with lower-case letters, but make sure it is syntactically correct.
If the name that you indicate (ex 'ATag') is already used in your program, then a name will be generated by adding 2 digits: 'ATag01' ou 'ATag02'...`,

  CVT_KLIST: `Specify if you want to convert the key lists (KLIST / KFLD) defined and used in the source to be converted.
There is no exact equivalent for KLIST / KFLD in Free syntax, but it is possible to indicate several key values directly in the file access instructions (CHAIN, SETLL, READE...).
---
The possible values are as follows:

## *YES
KLIST ( + KFLD) definitions are deleted. In all the lines where KLIST instructions were used, they are replaced by the list of variables that were defined with KFLD (even if these lines were already in Free syntax).
Before:

@code
  C     KORDDET       KLIST
  C                   KFLD         WOrdHdr
  C                   KFLD         a_Line(I)
   ...
  C     KORDDET       CHAIN        ORDDETF1
@end
After:

@code
      Chain (WOrdHdr : a_Line(I)) ORDDETF1;
@end
Just the following case prevents the deletion of KLIST/KFLD specifications:
- The KLIST / KFLD is used in at least one COPY clause.

## *NO
The KLIST ( + KFLD) definitions are left in traditional syntax. The are still used in the file access instructions converted to Free syntax.`,

  CVT_MOVEA: `The classic operation code MOVEA - assignment of values with array variables, considered like global strings which group all the elements - has no exact equivalence in Free form syntax.
However, depending on use cases, it's possible to manage their conversion more or less easily :
---
- Simple assignment of figurative constant,
- Simple assignment between 2 arrays with same type/length
- Use of the %SubArr BIF
- Use of redefinitions of the arrays, as strings, using pointers.
Only the following cases can't be converted and leave in traditional syntax using MOVEA (only when they might be managed using a pointer) :
- Arrays which total length of all the elements exceeds the maximum length allowed for a character string (65535 or 16383), when you are at V5R4 OS level.
- Arrays used as MOVEA result factor, but defined in the prototype of the program or procedure, with the CONST keyword.
The possible values are as follows:

## *ADVANCED
In addition to base cases (see *BASE), replaces most of the MOVEA by an instruction block using redefinition as string(s) via pointer(s), in order to run the operation with a simple %SUBST.
To do this, work variables are defined (when needed):
- AFrmArrStr & pAFrmArrStr: redefinition as a string and pointer for an array used in Factor 2.
- NFrmArrStrLen: Variable for the number of characters to be taken into account in the array used in Factor 2.
- AToArrStr & pAToArrStr : redefinition as a string and pointer for an array used in result factor.
- NToArrStrLen: Variable for the number of characters to be taken into account in the array used in result factor.
- NChgArrStrLen: Variable for the number of characters to change in the array used in result factor.
- If the variables are Unicode type, they are CFrmArrStr, etc..
- If the variables are Graphic type, they are GFrmArrStr, etc..
Depending on each case, the corresponding instruction block in Free form may have more or fewer instructions:
Sample 1 : Assignment of array elements to a string which is longer.
Before :

@code
  D  a_A01       s        1a     Dim(100)
  D  B02         s        2a
  ...
  C  Movea     a_A01(4)      B02
@end
After :

@code
  pAFrmArrStr = %Addr(a_A01(4));
  %Subst(B02:1:2) = %Subst(AFrmArrStr:1:2);
@end
Example 2 : Assignment between 2 arrays that have different element lengths, with variables as indexes:
(this case needs the most instructions)
Before :

@code
  D  a_A01       s        1a     Dim(100)
  D  a_B02       s        2a     Dim(100)
  ...
  C  Movea     a_A01(X1)     a_B02(X2)
@end
After :

@code
  NFrmArrStrLen = (%Elem(a_A01) + 1 - X1) * 1;
  NToArrStrLen = (%Elem(a_B02) + 1 - X2) * 2;
  NChgArrStrLen = NFrmArrStrLen;
  If NChgArrStrLen > NToArrStrLen;
    NChgArrStrLen = NToArrStrLen;
  EndIf;
  pAFrmArrStr = %Addr(a_A01(X1));
  pAToArrStr = %Addr(a_B02(X2));
  %Subst(AToArrStr:1:NChgArrStrLen)
     = %Subst(AFrmArrStr:1:NChgArrStrLen);
@end

## *BASE
The following cases are done using a simple evaluation :
- Assignment of a figurative constant (*BLANK, *ZERO, *LOVAL, *HIVAL, *ON, *OFF, *ALL' ') to all the elements of an array
- Assignment of a figurative constant (*ALL'xxxx', *ALLX'xxxxxx'), to all the elements of an array, when the length of the literal divides the length of one array element.
- Assignment of a numeric value to all the elements of a numeric array
- Assignment between an alphanumeric value and an array element which length is upper or equal, without padding blanks for the rest of the array.
The following cases are done using a partial evaluation of array(s), with %SubArr(...) :
- Assignment of a figurative constant (*BLANK, *ZERO, *LOVAL, *HIVAL, *ON, *OFF, *ALL' ') beginning from one array element
- Assignment of a figurative constant (*ALL'xxxx', *ALLX'xxxxxx'), beginning from one array element, when the length of the literal divides the length of one array element.
- Assignment between 2 arrays which have the same element lengths (for all the elements or just some elements).
When MOVEA is used to assign a list of '0' or '1' values in the array of indicators, from one of its elements and for a maximum of 8 elements
 ex : MOVEA '0100'  *IN(15)
then it is replaced by several instructions:

@code
     *INxx = '0';
  or *INxx = '1';
@end

## *NO
All MOVEA instructions stay in traditional syntax.`,

  CVT_SUBR: `This parameter allows you to specify if you want to convert the subroutines in the main part of the program to ILE procedures.
In the old source, subroutines (and their calls) are converted whether they use the old columned syntax or the new Free syntax.
---
Example
Before:

@code
  C             Exsr     SrAmount
  C             ....
  C  SrAmount   BegSr
  C
  C             EndSr
@end
After:

@code
      SrAmount();
      ...
      Dcl-Proc SrAmount;
      ...
      End-Proc SrAmount;
@end
However, the new ILE procedures have no parameters and no local variables; they they continue to use global variables in your source.
You can only request this change if you also convert the calculation specifications to Free format - CVTCLCSPEC(*FREE).
When you don't convert declaration specifications to Free format - CVTDCLSPEC(*NO) -, for each new procedure, it will create :
- D-Specs (for the prototype and procedure interface)
- P-Specs (for the begin and the end of each new procedure)
It's the case, when you need to compile your programs for V5R4 or V6R1 OS level.
Note: CAUTION: when the created object type is a *PGM, in order to use the ILE procedures, before being executed, your program must be genuinely ILE - specifically, it must no longer use the default activation group. If this is not the case, it will be necessary to recompile this source with DFTACTGRP(*NO), specifying if necessary a value for parameter ACTGRP(...).
This may change the execution context of your program and you may need to modify the scope of any OVRDBF commands executed in the calling programs.
The possible values are as follows:

## *NO
Subroutines are not converted into procedures.

## *YES
Most subroutines are converted into procedures.
However, the following subroutines cannot be converted to ILE procedures and therefore remain as subroutines:
- Subroutines already located in an ILE procedure outside the main body of the source;
- Subroutines using a GOTO with a "label" (TAG) located outside the subroutine;
- Subroutines using a RETURN operation code, in order to exit from the program;
- Subroutines using the %PARMS BIF, as %PARMS within a procedure contains the number of parameters of that procedure and not the number of parameters for the program.
- Special subroutines *INZSR and *PSSR;
- Subroutines that are defined as file error management subroutines (keyword INFSR)
- Subroutines using a file with the INFSR keyword (otherwise error message RNF5416 will be issued on compilation).
- And all subroutines that call a subroutine that cannot itself be converted (recursively).
If necessary, the new procedures are moved:
- after the routines that cannot be processed
- after O specifications
Note: In SQLRPGLE, no subroutine is processed if the SQL statement "WHENEVER ... GO TO label" is used.`,

  USEPARMNUM: `In V7R1, a new BIF %ParmNum(Param_Name) has been introduced, in order to avoid having to hard-code the "parameter number" - compare to %Parms. Additionally, when new parameters are added later, this avoids possible modification errors.
---
The possible values are as follows:

## *YES
When comparing the BIF %Parms and an integer is found, the integer is replaced by the equivalent BIF %ParmNum(Param_Name).
If the comparison is type "< n", it is treated as "<= n-1"
If the comparison is type "> n", it is treated as ">= n+1"
This modification is only made if you have also requested the conversion of calculation specifications. It is then applied to comparison instructions already coded in Free syntax.
This also works when the number of received parameters is retrieved using a variable defined in the SDS in positions 37 to 39 (or with *PARMS).
Note: NOTE, this new syntax option is only available in V7R1M0. If you do not have this option at your RPGLE or SQLRPGLE compiler level, the modification is not performed.

## *NO
The comparisons using %Parms are not modified.`,

  INDENT: `Specifies the indentation to be applied to the Free source, according to the programming operation structures used (IF, SELECT, ... ENDxx)
---
Note: This does not affect the instructions already in Free syntax.
Note: The indentation doesn't change for the instructions that are included after the compilation directives /ELSE, /ELSEIF or in 2 levels of /IF.
The possible values are as follows:

## 1-5
Number of blanks added for each new indentation.

## 0
No indentation is performed.`,

  INDENTCMT: `Specify whether you also want the comments preceding the indented instructions to be indented.
---
Note: This does not affect the comments already in Free syntax.
The possible values are as follows:

## *YES
If there is enough space, comments are indented - aligned with the following instructions.

## *NO
Converted comments are not indented, they begin in column 8.`,

  EMPTYCMT: `Allows you to define the action to be performed when blank comment lines are encountered: either with just an * in column 7, or //, or having just the specification letter in column 6, or for totally blank lines.
---
Note: If there are characters in columns 1-5 for these rows, they are ignored for these tests.
The possible values are as follows:

## *KEEP
All lines are preserved; the empty comment lines (with * in column 7) are converted to Free comments (//).

## *BLANK
All lines are preserved; the empty comment lines (with * in column 7) or those already in Free format (//), are entirely set to blank.

## *ONELINE
The blank comment lines (with an * in column 7) or those already in Free format (//), are entirely set to blank. However, if several blank lines follow each other, then only one is retained.

## *REMOVE
All the lines described below are deleted:
- Lines with just one * in column 7
- Lines with an empty comment in Free syntax (//)
- Lines already totally blank.`,

  KEEPDSIND: `Defines whether you want to keep the existing indentation for different fields of a Data Structure, as they are specified in the D specifications.
---
The possible values are as follows:

## *NO
The names of all the fields that make up a DS are aligned.

## *YES
The names of the fields that are part of a DS keep their indentation, as in the original source.
Note: However, if the field names started in column 7, they are aligned with those starting in column 8`,

  OPCODECASE: `Allows you to choose the case for the calculation operation codes converted to Free syntax (eg.: EvalR, Chain, When...).
Note: This does not affect the instructions already in Free syntax.
---
The possible values are as follows:

## *MIXED
Operation codes are written in mixed case: the first character of each constituant "word" of the operation code is in upper case, the other characters are in lower case.

## *UPPER
All operation codes are written in upper case.

## *LOWER
All operation codes are written in lower case.`,

  BLTFNCCASE: `Allows you to choose the case for the "built-in-function" names on lines converted to Free syntax (eg.: %Subst, %Len, %Scan...).
Note: This does not affect the instructions already in Free syntax.
---
The possible values are as follows:

## *MIXED
The built-in-function names are written in mixed case: the first character of each constituant "word" in the "built-in-function" name is in upper case, the other characters are in lower case.

## *UPPER
The built-in-function names are written in upper case.

## *LOWER
The built-in-function names are written in lower case.`,

  SPCWRDCASE: `Allows you to choose the case for the special words used in calculation specifications converted to Free syntax (eg.: *Blank, *Null, *Zero...).
Note: This does not affect the instructions already in Free syntax.
---
The possible values are as follows:

## *MIXED
Special words are written in mixed case: the first character of each constituant "word" of the operation code is in upper case, the other characters are in lower case.

## *UPPER
The special words are written in upper case.

## *LOWER
The special words are written in lower case.`,

  KEYWRDCASE: `Allows you to choose the case for the keywords used in declaration specifications converted to Free syntax (eg.: Dcl-Ds, Char, Keyed...)
Note: This does not affect the instructions already in Free syntax, nor the keywords already in H, F, P or D specifications.
---
The possible values are as follows:

## *MIXED
Keywords are written in mixed case: the first character of each constituant "word" of the operation code is in upper case, the other characters are in lower case.

## *UPPER
All keywords are written in upper case.

## *LOWER
All keywords are written in lower case.`,

  MAXNOTFREE: `This parameter is only active if you have requested to convert to "Fully-Free" syntax.
---
In principle, a source that has been converted to "Fully-Free" syntax cannot contain any source line that is in "traditional" syntax.
However, Arcad Transformer RPG allows the possibility to obtain a source that is almost "Fully-Free", but has some blocks that remain in traditional syntax. NOTE: IBM do not officially support this:
- it is not recognized in the RDi 9.5 editor;
- but it is supported by the RPGLE compiler.
In such a case, in order to get a real "Fully-Free" source, editable using RDi, you should modify these blocks of lines:
- either by rewriting them in Free syntax (mainly for C-Specs)
- or by moving them to /COPY clauses (mainly for F-, I- or O-Specs).
The possible values are as follows:

## *NONE
No source lines in traditional syntax are permitted. If at least one source line cannot be converted to "Free" syntax, then the source is not converted to "Fully-Free" syntax.

## 1-999
You can specify a maximum number of "source line blocks" not converted to "Free" syntax; in this case, they will be enclosed in special directives to allow the compilation.
Example :

@code
  **END-FREE
         C                 GOTO       TAG07
  **FREE
@end

## *NOMAX
No limit is put on the maximum number of "source line blocks" that remain in traditional syntax.`,

  FIRSTCOL: `This parameter is only active if you have requested to convert to "Fully-Free" syntax.
---
It allows you to specify which column to start the source line. But of course, when the lines are indented, they are shifted to the right.
The possible values are as follows:

## 1
By default, the non-indented source lines start in column 1 (as opposed to column 8 in Free syntax).

## 2-5
The non-indented source lines start in column 2 to 5.`,

  NUMTRUNCA: `This parameter specifies whether to analyze the risk of numeric truncation, related to the conversion of the following addition/subtraction operation codes, when the length of factor 1 or factor 2 is greater than that of the result field.
---
- ADD
- SUB
For these addition/subtraction operation codes, it is relatively rare that the developer would have intentionally used a numeric truncation, in order to extract the last digits.
When the specified value is *YES, *WNG1 or *WNG2, the truncation risk analysis is performed for numeric fields. The warnings are then placed in file AARFCHWF1, which you can view/manage via the ARCAD Transformer PlugIn interface.
In this PlugIn, you can choose, for each instruction, whether:
- official converted instruction has to be more complex, in order to take into account the risk of numeric truncation.
- a warning comment (one or two lines) is placed in the converted source.
If actions are entered for some source lines via the PlugIn, they are substituted for the values *YES, *WNG1 or *WNG2 specified in this parameter.
If no action is entered for source lines via the PlugIn, then:
- the official converted instruction is simple, by "assuming" that the risk of truncation is unlikely.
- depending on the value of this parameter, either no comments are added to the converted source, or one or two lines are added as comments.
The possible values are as follows:

## *WNG1
When a risk of numeric field truncation is detected, a warning message is placed in comment, in the converted source, after the converted instruction.
If the operation code has no factor 1, the message is of the form:

@code
// *CVTWNG *NUMTRUNCx : Ope-Code  Type(len,dec)->Type(len,dec)
@end
If the operation code has a factor 1, the message is of the form:

@code
// *CVTWNG *NUMTRUNCx : Type(len,dec)  Ope-Code Type(len,dec)->Type(len,dec)
@end

## *WNG2
When a risk of numeric field truncation is detected, 2 comment lines are placed in the source after the converted instruction.
- First a message like *CVTWNG NUMTRUNCx .... (see *WNG1)
- Followed by the alternative instruction, managing or not an identical operation for the numeric truncation.
If necessary, you can manually replace the current instruction with this alternative instruction.

## *YES
The risk of truncation for a numeric field is detected for this type of instruction. The warnings issued can be viewed/managed via the ARCAD Transformer PlugIn.
By default, no comment is added in the source.

## *NO
The risk of truncation for numeric fields is not detected for this type of instruction.`,

  NUMTRUNCB: `This parameter specifies whether to analyze the risk of numeric truncation, related to the conversion of the following addition/subtraction operation codes, when the length of factor 1 and factor 2 is not greater than that of the result field, but either factor 1 is not specified, or the length of factor 1 or factor 2 are equal to that of the result field. A risk of exceeding the field size (MCH1210) exists if there is a remainder for the following operation codes:
---
- ADD
- SUB
Since it is exceptional for the developer to have deliberately used numeric truncation in this case, in order to extract the last digits, the default value here is *NO.
When the specified value is *YES, *WNG1 or *WNG2, the truncation risk analysis is performed for numeric fields. The warnings are then placed in file AARFCHWF1, which you can view/manage via the ARCAD Transformer PlugIn interface.
In this PlugIn, you can choose, for each instruction, whether:
- official converted instruction has to be more complex, in order to take into account the risk of numeric truncation.
- a warning comment (one or two lines) is placed in the converted source.
If actions are entered for some source lines via the PlugIn, they are substituted for the values *YES, *WNG1 or *WNG2 specified in this parameter.
If no action is entered for source lines via the PlugIn, then:
- the official converted instruction is simple, by "assuming" that the risk of truncation is unlikely.
- depending on the value of this parameter, either no comments are added to the converted source, or one or two lines are added as comments.
The possible values are as follows:

## *NO
The risk of truncation for numeric fields is not detected for this type of instruction.

## *WNG1
When a risk of numeric field truncation is detected, a warning message is placed in comment, in the converted source, after the converted instruction.
If the operation code has no factor 1, the message is of the form:

@code
// *CVTWNG *NUMTRUNCx : Ope-Code  Type(len,dec)->Type(len,dec)
@end
If the operation code has a factor 1, the message is of the form:

@code
// *CVTWNG *NUMTRUNCx : Type(len,dec)  Ope-Code Type(len,dec)->Type(len,dec)
@end

## *WNG2
When a risk of numeric field truncation is detected, 2 comment lines are placed in the source after the converted instruction.
- First a message like *CVTWNG NUMTRUNCx .... (see *WNG1)
- Followed by the alternative instruction, managing or not an identical operation for the numeric truncation.
If necessary, you can manually replace the current instruction with this alternative instruction.

## *YES
The risk of truncation for a numeric field is detected for this type of instruction. The warnings issued can be viewed/managed via the ARCAD Transformer PlugIn.
By default, no comment is added in the source.`,

  NUMTRUNCD: `This parameter specifies whether to analyze the risk of numeric truncation, related to the conversion of the division (DIV) operation code, when the length of the integer result for this operation could be greater than that of the result field.
---
For these division operation codes, it is relatively rare that the developer would have intentionally used a numeric truncation, in order to extract the last digits. However, this could be a manipulation of date fields in order to shift digits by dividing by 100, 10000, 0.01...
When the specified value is *YES, *WNG1 or *WNG2, the truncation risk analysis is performed for numeric fields. The warnings are then placed in file AARFCHWF1, which you can view/manage via the ARCAD Transformer PlugIn interface.
In this PlugIn, you can choose, for each instruction, whether:
- official converted instruction has to be more complex, in order to take into account the risk of numeric truncation.
- a warning comment (one or two lines) is placed in the converted source.
If actions are entered for some source lines via the PlugIn, they are substituted for the values *YES, *WNG1 or *WNG2 specified in this parameter.
If no action is entered for source lines via the PlugIn, then:
- the official converted instruction is simple, by "assuming" that the risk of truncation is unlikely.
- depending on the value of this parameter, either no comments are added to the converted source, or one or two lines are added as comments.
The possible values are as follows:

## *WNG1
When a risk of numeric field truncation is detected, a warning message is placed in comment, in the converted source, after the converted instruction.
If the operation code has no factor 1, the message is of the form:

@code
// *CVTWNG *NUMTRUNCx : Ope-Code  Type(len,dec)->Type(len,dec)
@end
If the operation code has a factor 1, the message is of the form:

@code
// *CVTWNG *NUMTRUNCx : Type(len,dec)  Ope-Code Type(len,dec)->Type(len,dec)
@end

## *WNG2
When a risk of numeric field truncation is detected, 2 comment lines are placed in the source after the converted instruction.
- First a message like *CVTWNG NUMTRUNCx .... (see *WNG1)
- Followed by the alternative instruction, managing or not an identical operation for the numeric truncation.
If necessary, you can manually replace the current instruction with this alternative instruction.

## *YES
The risk of truncation for a numeric field is detected for this type of instruction. The warnings issued can be viewed/managed via the ARCAD Transformer PlugIn.
By default, no comment is added in the source.

## *NO
The risk of truncation for numeric fields is not detected for this type of instruction.`,

  CHECKIND: `This parameter specifies whether to analyze the risks due to the fact that the %Check (or %CheckR) BIF, used to convert operation code CHECK (ou CHECKR), does not update the %Found indicator.
---
When the specified value is *YES or *WNG1, the analysis for using the %Found or %Equal indicators in the same source is performed. The warnings are then placed in file AARFCHWF1, which you can view/manage via the ARCAD Transformer PlugIn interface.
In this PlugIn, you can choose, for each instruction:
- to replace the use of %Found or %Equal with a test based on the value of the position or the result index. However, this is done automatically only if this test appears on the instruction that immediately follows the converted CHECK(R), SCAN or LOOKUP.
- To insert a warning comment just after the converted instruction.
If actions are entered for some source lines via the PlugIn, they are substituted for the *YES or *WNG1 values specified in this parameter.
If no action is entered for a source line via the PlugIn, then:
- no replacement of %Found or %Equal is performed on the next instruction.
- depending on the value of this parameter, a comment is added (or not) in the converted source.
The possible values are as follows:

## *WNG1
For this operation code, the possible use in the source of indicators %Found or %Equal is analyzed.
The warnings issued can be viewed/managed via the ARCAD Transformer PlugIn.
In addition, a comment is added to the converted source.

## *YES
For this operation code, the possible use in the source of indicators %Found ou %Equal is analyzed.
The warnings issued can be viewed/managed via the ARCAD Transformer PlugIn.
By default, no comment is added to the source.

## *NO
For this operation code, the possible use in the source of indicators %Found or %Equal is not analyzed. No warning message is issued.`,

  SCANIND: `This parameter specifies whether to analyze the the risks because the BIF %Scan, used to convert the operation code SCAN, does not update the %Found indicator.
---
When the specified value is *YES or *WNG1, the analysis for using the %Found or %Equal indicators in the same source is performed. The warnings are then placed in file AARFCHWF1, which you can view/manage via the ARCAD Transformer PlugIn interface.
In this PlugIn, you can choose, for each instruction:
- to replace the use of %Found or %Equal with a test based on the value of the position or the result index. However, this is done automatically only if this test appears on the instruction that immediately follows the converted CHECK(R), SCAN or LOOKUP.
- To insert a warning comment just after the converted instruction.
If actions are entered for some source lines via the PlugIn, they are substituted for the *YES or *WNG1 values specified in this parameter.
If no action is entered for a source line via the PlugIn, then:
- no replacement of %Found or %Equal is performed on the next instruction.
- depending on the value of this parameter, a comment is added (or not) in the converted source.
The possible values are as follows:

## *WNG1
For this operation code, the possible use in the source of indicators %Found or %Equal is analyzed.
The warnings issued can be viewed/managed via the ARCAD Transformer PlugIn.
In addition, a comment is added to the converted source.

## *YES
For this operation code, the possible use in the source of indicators %Found ou %Equal is analyzed.
The warnings issued can be viewed/managed via the ARCAD Transformer PlugIn.
By default, no comment is added to the source.

## *NO
For this operation code, the possible use in the source of indicators %Found or %Equal is not analyzed. No warning message is issued.`,

  LOOKUPIND: `This parameter specifies whether to analyze the the risks because the %LookUpXX (or %TLookUpXX) BIF, used to convert the operation code LOOKUP, does not update the indicators %Found and %Equal.
---
When the specified value is *YES or *WNG1, the analysis for using the %Found or %Equal indicators in the same source is performed. The warnings are then placed in file AARFCHWF1, which you can view/manage via the ARCAD Transformer PlugIn interface.
In this PlugIn, you can choose, for each instruction:
- to replace the use of %Found or %Equal with a test based on the value of the position or the result index. However, this is done automatically only if this test appears on the instruction that immediately follows the converted CHECK(R), SCAN or LOOKUP.
- To insert a warning comment just after the converted instruction.
If actions are entered for some source lines via the PlugIn, they are substituted for the *YES or *WNG1 values specified in this parameter.
If no action is entered for a source line via the PlugIn, then:
- no replacement of %Found or %Equal is performed on the next instruction.
- depending on the value of this parameter, a comment is added (or not) in the converted source.
The possible values are as follows:

## *WNG1
For this operation code, the possible use in the source of indicators %Found or %Equal is analyzed.
The warnings issued can be viewed/managed via the ARCAD Transformer PlugIn.
In addition, a comment is added to the converted source.

## *YES
For this operation code, the possible use in the source of indicators %Found ou %Equal is analyzed.
The warnings issued can be viewed/managed via the ARCAD Transformer PlugIn.
By default, no comment is added to the source.

## *NO
For this operation code, the possible use in the source of indicators %Found or %Equal is not analyzed. No warning message is issued.`,

  NUMTRUNCZ: `This parameter specifies whether to analyze the risk of numeric truncation, related to the conversion of the following assignment operation codes:
---
- Z-ADD
- Z-SUB
- PARM (when factor 1 or factor 2 are specified).
For these assignment operation codes, the developer may intentionally perform a numeric truncation, in order to extract the last digits.
When the specified value is *YES, *WNG1 or *WNG2, the truncation risk analysis is performed for numeric fields. The warnings are then placed in file AARFCHWF1, which you can view/manage via the ARCAD Transformer PlugIn interface.
In this PlugIn, you can choose, for each instruction, whether:
- official converted instruction has to be more complex, in order to take into account the risk of numeric truncation.
- a warning comment (one or two lines) is placed in the converted source.
If actions are entered for some source lines via the PlugIn, they are substituted for the values *YES, *WNG1 or *WNG2 specified in this parameter.
If no action is entered for source lines via the PlugIn, then:
- the official converted instruction is simple, by "assuming" that the risk of truncation is unlikely.
- depending on the value of this parameter, either no comments are added to the converted source, or one or two lines are added as comments.
The possible values are as follows:

## *WNG1
When a risk of numeric field truncation is detected, a warning message is placed in comment, in the converted source, after the converted instruction.
If the operation code has no factor 1, the message is of the form:

@code
// *CVTWNG *NUMTRUNCx : Ope-Code  Type(len,dec)->Type(len,dec)
@end
If the operation code has a factor 1, the message is of the form:

@code
// *CVTWNG *NUMTRUNCx : Type(len,dec)  Ope-Code Type(len,dec)->Type(len,dec)
@end

## *WNG2
When a risk of numeric field truncation is detected, 2 comment lines are placed in the source after the converted instruction.
- First a message like *CVTWNG NUMTRUNCx .... (see *WNG1)
- Followed by the alternative instruction, managing or not an identical operation for the numeric truncation.
If necessary, you can manually replace the current instruction with this alternative instruction.

## *YES
The risk of truncation for a numeric field is detected for this type of instruction. The warnings issued can be viewed/managed via the ARCAD Transformer PlugIn.
By default, no comment is added in the source.

## *NO
The risk of truncation for numeric fields is not detected for this type of instruction.`,

  ALPHTONUM: `With this parameter you can indicate that you want to examine the risks inherent in assigning alphanumeric values to numeric fields, using operation codes MOVE or MOVEL.
---
This analysis is done when *YES or *WNG1 is set for this parameter. The warnings are then put into file AARFCHWF1, which you can view/manage via the ARCAD Transformer PlugIn interface.
In this PlugIn, you can choose, for each instruction:
- to insert the warning in comments, just after the converted instruction.
If actions are entered for certain source lines via the PlugIn, they override the *YES or *WNG1 values specified for this parameter.
If no action is entered for a source line via the PlugIn, then:
- dependant on the value of this parameter, a comment is (or is not) added to the converted source.
The possible values are as follows:

## *YES
For MOVE and MOVEL, each case where an alphanumeric value is assigned to a numeric field is examined.
Any warnings issued can be listed/managed via the ARCAD Transformer PlugIn interface.
By default, no comment is added to the source.

## *WNG1
For MOVE and MOVEL, each case where an alphanumeric value is assigned to a numeric field is examined.
Any warnings issued can be listed/managed via the ARCAD Transformer PlugIn interface.
In addition, a comment is added to the converted source.

## *NO
For MOVE and MOVEL, cases where an alphanumeric value is assigned to a numeric field are not examined. No warnings are issued.`,

  PRECPL: `Specifies which syntax has been used for the pre-compilation clauses added at the start of the source.
---
The possible values are as follows:

## *ARCAD
By default, the syntax of ARCAD pre-compilation clauses is used.

## *ALDON
Aldon precompilation clause syntax is used.`,

  SRCDATE: `Indicates how the date field is modified (for each source line) in the converted source.
---
The possible values are as follows:

## *CURRENT
For lines added or modified, the date for each record is set to the current date.
For other non-modified lines, the previous date is retained.

## *ZERO
For all records in the new source, the date is set to '000000'.

## *KEEP
For the changed lines, the old date is kept.
For the added lines, the date is set to the current date.
For other non-modified lines, the previous date is retained.
Note: Attention, some instructions that were using only one line - in the old source - may use several lines after conversion; in that case, only the first line will keep the old source date; the other new lines will be set to the current date.`,

  FLGCVTTYPE: `Specify if you wish to place an identifying mark for each type of conversion in columns 1-5 of the converted source.
---
The possible values are as follows:

## *NO
Columns 1-5 of the new source are set to blank (for added or modified lines).

## *YES
In columns 1-5, a mark is added identifying the conversions as follows:
- Gnnn : conversion of branching instructions (GOTO/TAG)
- Cnnn : conversion of program calls (CALL/CALLP)
- Xnnn : conversion of other operation codes
- Snnn : instruction not converted - no equivalent in Free syntax
Note: This is mainly for the development of conversions, or in case of conversion problems.

## *KEEP
The values (comments) in the old source in columns 1-5 are retained for added or modified lines (in most cases).
However, any special color attribute characters are replaced by blanks.
Note: Please note that keeping these comments in columns 1-5 can be annoying in RDi, because they can appear in the "active" columns of the source, if we make a shift to the right using the "RRn" LPEX source editor command.`,

  CLRXREF: `Specifies whether to delete X-Ref data generated at the start of the process and used for conversion of the RPGLE.
---
The possible values are as follows:

## *YES
The temporary X-Ref data is not conserved.

## *NO
The temporary X-Ref data is conserved at the end of processing. They are therefore never cleared.`,

  CLRFRMCHG: `Specify if you want to delete the converted source lines added to Arcad file "AARFCHSF1";
---
The possible values are as follows:

## *YES
The lines of converted source put in file AARFCHSF1 are not retained. This is the recommended value if you have specified a destination source member.

## *NO
The lines of converted source are retained at the end of the process in file AARFCHSF1. These lines will never be purged. This is the required value if you have specified *NONE for the destination source member.`,
};
