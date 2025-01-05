# Transformer RPG View

The **Transformer RPG View** provides a centralized interface for managing RPGLE file conversions. This powerful tool streamlines the process of converting fixed-format RPG code to free-format, offering batch processing capabilities and detailed conversion management.

## **Manage Conversion List**

### **Add Item to Conversion List**
1. Right-click an RPGLE file in the **Code for IBM i Object Explorer**.
2. Select **Add to Conversion List**.
   - The **Conversion List** dialog will appear
   - Choose from available conversion lists or create a new one
   - You can add multiple files simultaneously by selecting add to conversion list on Source File

<!-- > **Note**: Only RPGLE source members with fixed or mixed format are eligible for conversion. -->

### **Remove Item from Conversion List**
1. In the **Transformer RPG View**, locate the item you want to remove.
2. Right-click the item and select **Remove from Conversion List**.
   - Items can be removed whether they've been converted or not
   - Removing an item doesn't affect the original or converted source files

### **Update Object Type for Conversion**
1. In the **Transformer RPG View**, select the target member.
2. Click the update object icon or use the context menu.
3. Choose the desired object type:
   - *NONE: No compilation after conversion
   - *MODULE: Create a module object
   - *PGM: Create a program object
4. The change is reflected immediately in the conversion list.

> **Important**: The object type determines post-conversion processing. Choose carefully based on your requirements.

## **Trigger Batch Conversion**

### **Convert Selected Members**
1. Select one or more members in the conversion list:
   - Click on `Convert to Fully Free` icon on the Member Item to convert a single member 
   - Click on `Convert to Fully Free` icon on Conversion List to convert multiple members
2. During conversion:
   - Progress is shown for each member
   - Conversion status updates in real-time
   - Error messages appear after conversion completion in generated Report

> **Tip**: You can continue working while conversions run in the background.

### **Convert All Members**
1. Click "Convert All Members" in the toolbar or command palette
2. The system will:
   - Process members sequentially
   - Skip already converted members unless forced to reconvert
   - Generate detailed logs for each conversion
   - Update the status for each member upon completion

## **View and Compare Sources**

### **Open Original Source**
1. Right-click any converted item
2. Select "Open Original Source"
   - Opens in read-only mode by default
   - Displays the original fixed-format code
   - Shows all specifications and formatting
   - Enables direct comparison with converted version

### **Open Converted Source**
1. Right-click a successfully converted item
2. Select "Open Converted Source"
   - Shows the new free-format RPG code
   - All specifications are properly aligned
   - Comments and documentation are preserved
   - Indentation follows modern RPG conventions

<!-- > **Pro Tip**: Use VS Code's built-in diff viewer to compare original and converted sources side by side by selecting both files and choosing "Compare Selected". -->

## **Best Practices**

- Regularly backup your source members before batch conversion
- Review converted code thoroughly, especially complex calculations and business logic
- Test converted programs in a development environment first
- Use source control to track changes between versions
- Document any manual adjustments needed after conversion

## **Troubleshooting**

If conversion fails:
1. Check the Problems view for specific error messages
2. Verify the original source member is valid and compiles
3. Ensure proper permissions on source files and libraries
4. Review any custom conversion rules that may be applied
5. Contact support if issues persist
