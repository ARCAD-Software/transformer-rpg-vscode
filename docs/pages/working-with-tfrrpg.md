# Working with Transformer RPG

### Conversion Options

The `Arcad Transformer-RPG` extension provides powerful capabilities to convert traditional RPG source code to modern fully free format RPG. You can either convert files individually or add them to a batch conversion list for bulk conversion.


> `Note:` The extension supports two primary conversion workflows: single member conversion and batch conversion of entire source files.
---

## Convert a Single Member
1. Navigate to the `Code for IBM i Object Explorer` in your VS Code sidebar
2. Locate the RPGLE member you want to convert
3. Right-click the member to open the context menu
4. Select `Convert to Fully Free` from the available options

When the `Configuration Panel` appears, you'll have access to these important settings:

- `Target Library Configuration`:
  - Default library is automatically selected based on your current connection
  - You can type a different library name or use the dropdown to select from available libraries
  - The target library must have appropriate authorities for the conversion process

- `Detailed Conversion Options`:
  - `Target Format`: Choose between *FULLY FREE or *FREE
  - `Indentation Style`: Select 2 spaces, 4 spaces, or tab
  - `Comment Handling`: Specify how existing comments should be processed
  - `Variable Naming`: Configure modern naming conventions for variables
  - `Procedure Interface`: Choose between modern or traditional procedure interfaces

After configuring your settings:
- Click `Convert` to perform a one-time conversion
- Use `Convert & Save` to store your configuration for future conversions

##  Convert All Members of a Source File
1. In the `Code for IBM i Object Explorer`, locate the source file containing RPGLE members
2. Right-click the source file to access the context menu
3. Select `Convert to Fully Free`

The batch conversion process includes these additional features:
- Automatic detection of member types
- Parallel processing for faster conversion
- Detailed conversion logs
- Progress tracking for large source files

`Important Considerations:`
- Ensure you have proper backup before converting multiple members
- Review conversion logs for any warnings or errors

The conversion process will:
1. Convert fixed-format specifications to free format
2. Apply modern RPG best practices
3. Generate converted source in the target library

---
