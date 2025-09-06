/**
 * ! DANGER: This function will wipe existing data in the specified sheets.
 * Sets up the spreadsheet with the required sheets, headers, and initial sample data.
 * Run this function once from the script editor to initialize the database.
 */
function initializeDatabase() {

  // --- IMPORTANT: PASTE YOUR SPREADSHEET ID HERE ---
  // This MUST be the same ID you use in your Code.gs file.
  const SPREADSHEET_ID = "1imBXRCq-vbTUN33v2-QUkX7VDv611lQNk6d2qs5BRKI";

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  if (!ss) {
    Browser.msgBox("Error", "Could not open spreadsheet. Please check that the SPREADSHEET_ID is correct.", Browser.Buttons.OK);
    return;
  }

  // --- 1. Define the required structure ---
  const requiredSheets = {
    "StoreInfo": {
      headers: ["Key", "Value"],
      data: [
        ["storeName", "Quench & Crave"],
        ["openingTime", "09:00"],
        ["closingTime", "22:00"],
        ["phoneNumber", "02 40536 998"],
        ["ownerEmail", "your-email@example.com"] // <-- IMPORTANT: Change this email
      ]
    },
    "Menu": {
      headers: ["id", "name", "price", "category", "image", "timeStart", "timeEnd", "discount"],
      data: [
        [1, "Iced Coffee", 3.5, "Drinks", "https://lh3.googleusercontent.com/d/1tcQgCowt4cabeC_wHQ6A6E4akpHwSTfq", "", "", ""],
        [2, "Avocado Toast", 7.0, "Food", "https://lh3.googleusercontent.com/d/1PsV8aZTyFoAOvm8sj5PqM9ytFBgRwLoS", "09:00", "15:00", ""],
        [3, "Sandwich", 6.5, "Food", "https://lh3.googleusercontent.com/d/1bBssDmPTMlbTtqDkRLdOuo6MHvMGQh_v", "", "", ""],
        [4, "Morning Special", 9.0, "Combos", "https://lh3.googleusercontent.com/d/17Q4MdT02XHwbGKv8Fhyt6PiLfhrBwH7-", "09:00", "11:00", 1.5],
        [5, "Smoothie", 5.0, "Drinks", "https://lh3.googleusercontent.com/d/1xOxlbcor9Vdjd1R-ND2KeoAnCtK_e-pq", "", "", ""],
        [6, "Pastries", 4.5, "Bakery", "https://lh3.googleusercontent.com/d/1ZhsDR3KaHLx_oAS8ZJpgS_bvqczR538V", "", "", ""],
        [7, "Salads", 8.0, "Healthy", "https://lh3.googleusercontent.com/d/1z_RX-KigCtQHZy-rmNjMlFyiGfwTCSdB", "", "", ""]
      ]
    },
    "Orders": {
      headers: ["Timestamp", "OrderID", "Name", "Phone", "Items", "Total Price", "Discount", "Status"],
      data: [] // Orders sheet starts empty
    }
  };

  // --- 2. Loop through and set up each sheet ---
  for (const sheetName in requiredSheets) {
    let sheet = ss.getSheetByName(sheetName);

    // If sheet doesn't exist, create it
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`Sheet "${sheetName}" created.`);
    } else {
      Logger.log(`Sheet "${sheetName}" already exists. Clearing content.`);
    }

    // Clear existing data and formatting
    sheet.clear();

    const headers = requiredSheets[sheetName].headers;
    const initialData = requiredSheets[sheetName].data;

    // Set header row and style it
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#f3f3f3");
    Logger.log(`Headers written to "${sheetName}".`);

    // Write initial data if it exists
    if (initialData.length > 0) {
      sheet.getRange(2, 1, initialData.length, initialData[0].length).setValues(initialData);
      Logger.log(`Initial data populated in "${sheetName}".`);
    }

    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, headers.length);
  }

  SpreadsheetApp.flush(); // Apply all pending changes
  Logger.log("Database initialization complete!");
  Browser.msgBox("Database Setup Complete", "Your Google Sheet has been successfully initialized.", Browser.Buttons.OK);
}
