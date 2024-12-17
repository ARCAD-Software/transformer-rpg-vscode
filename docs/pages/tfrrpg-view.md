# Transformer RPG View

The **Transformer RPG View** is used for managing and processing the conversion list, allowing users to add, remove, and update members in the list, and trigger conversions.

---

## **Manage Conversion List**

### **Add Item to Conversion List**
1. Right-click an RPGLE file in the **Code for IBM i Object Explorer**.
2. Select **Add to Conversion List**.
   - The **Conversion List** will appear.
   - Choose the **conversion list** to which you want to add

3. The selected item will be added to the **Conversion List**.

### **Remove Item from Conversion List**
1. In the **Transformer RPG View**, select the item you want to remove from the list.
2. Right-click the item and select **Remove from Conversion List**.
   - The selected item will be removed from the list.

   ![Remove Item from Conversion List](../media/remove-item-from-conversion-list.png)

### **Update Object Type for Conversion**
1. In the **Transformer RPG View**, select a member that has been added to the conversion list.
2. Click on the update object icon to **Update Object Type**.
3. In the prompt, choose the new **object type** (e.g., *NONE , *MODULE, *PGM).
4. The object type will be updated in the conversion list, reflecting the change in the conversion list.

   ![Update Object Type](../media/update-object-type.png)

---

## **Trigger Batch Conversion**

Once the conversion list is ready, you can initiate the conversion process.

### **Convert Selected Members**
1. In the **Transformer RPG View**, select the members you want to convert from the list.
2. Click **Convert Selected Members**.
   - The selected files will be processed and converted.

   ![Convert Selected Members](../media/convert-selected-members.png)

### **Convert All Members**
1. If you wish to convert all members in the list at once, select **Convert All Members**.
   - This will trigger the conversion of all files in the **Conversion List**.

   ![Convert All Members](../media/convert-all-members.png)

---

## **View Converted and Original Source**

Once an item is converted, you can view both the original and converted source files.

### **Open Original Source**
1. After conversion, right-click the converted item in the **Transformer RPG View**.
2. Select **Open Original Source**.
   - The original source file will open for comparison.

   ![Open Original Source](../media/open-original-source.png)

### **Open Converted Source**
1. After conversion, right-click the converted item.
2. Select **Open Converted Source**.
   - The newly converted fully free format file will open.

   ![Open Converted Source](../media/open-converted-source.png)

---

This enhanced section includes all the necessary actions for managing conversion lists, updating member properties, and viewing both the original and converted sources. Let me know if you need any more changes or additions!
