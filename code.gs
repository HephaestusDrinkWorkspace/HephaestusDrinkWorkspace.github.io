// Replace with the ID of your Google Sheet
const SPREADSHEET_ID = "1imBXRCq-vbTUN33v2-QUkX7VDv611lQNk6d2qs5BRKI";
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

const storeInfoSheet = ss.getSheetByName("StoreInfo");
const menuSheet = ss.getSheetByName("Menu");
const ordersSheet = ss.getSheetByName("Orders");

/**
 * Serves the HTML file for the web app.
 * @param {Object} e - The event parameter for a GET request.
 * @returns {HtmlOutput} The HTML output for the web app.
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  return template
    .evaluate()
    .setTitle('赫淮斯托斯飲料')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Includes other HTML files into the main HTML file.
 * @param {string} filename - The name of the file to include.
 * @returns {string} The content of the HTML file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Fetches all menu and store data from the spreadsheet.
 * This function uses .getDisplayValues() to ensure all data is retrieved as strings,
 * avoiding any issues with Date objects and time zones.
 * It also parses the 'components' column for combo items.
 * @returns {Object} An object containing store information and menu items.
 */
function getMenuData() {
  try {
    // --- Fetch Store Info using getDisplayValues() ---
    const storeInfoData = storeInfoSheet.getDataRange().getDisplayValues();
    const storeInfo = {};
    storeInfoData.slice(1).forEach((row) => {
      if (row[0]) storeInfo[row[0]] = row[1];
    });

    // --- Fetch Menu Items using getDisplayValues() ---
    const menuData = menuSheet.getDataRange().getDisplayValues();
    const menuHeaders = menuData[0];
    const menuItems = menuData
      .slice(1)
      .map((row) => {
        if (row.every((cell) => cell === "")) return null;

        const item = {};
        menuHeaders.forEach((header, index) => {
          let value = row[index];

          // Convert 'price', 'discount', and 'id' strings to numbers.
          if (header === "price" || header === "discount" || header === "id") {
            item[header] = value ? parseFloat(value) : 0;
          }
          // *** NEW LOGIC FOR COMBOS ***
          // If the header is 'components', parse the comma-separated string into an array of numbers.
          else if (header === "components") {
            item[header] = value
              ? value.split(",").map((id) => parseInt(id.trim()))
              : [];
          }
          // Create a nested 'time' object for time-related fields
          else if (header === "timeStart" || header === "timeEnd") {
            if (!item.time) item.time = {};
            item.time[header.replace("time", "").toLowerCase()] = value;
          }
          // Handle all other fields
          else {
            item[header] = value;
          }
        });
        return item;
      })
      .filter((item) => item !== null);

    // Return the final, clean data object
    return {
      storeName: storeInfo.storeName,
      openingTime: storeInfo.openingTime,
      closingTime: storeInfo.closingTime,
      contact: storeInfo.contact,
      items: menuItems,
    };
  } catch (e) {
    Logger.log(e);
    return { error: "Failed to load menu data. " + e.message };
  }
}

/**
 * Places an order by writing it to the 'Orders' sheet and sending an email to multiple recipients.
 * This function is called by the frontend.
 * @param {Object} orderDetails - The details of the order from the client.
 * @returns {Object} A confirmation object with the new Order ID.
 */
function placeOrder(orderDetails) {
  try {
    const timestamp = new Date();
    const orderId = "ORD-" + Math.floor(timestamp.getTime() / 1000);
    const status = "Pending";

    // Format items for logging
    const itemsString = orderDetails.items
      .map((item) => `${item.name} (x${item.quantity})`)
      .join(", ");

    // Get owner emails for notification and split them into an array
    const notifyEmails = storeInfoSheet.getRange("B6").getValue(); // Assumes emails are in B6, comma-separated

    ordersSheet.appendRow([
      timestamp,
      orderId,
      orderDetails.customer.name,
      orderDetails.customer.phone,
      itemsString,
      orderDetails.total,
      orderDetails.discount,
      status,
    ]);

    // Send email notification if email addresses are provided
    if (notifyEmails) {
      const subject = `收到新的訂單: ${orderId}`;
      const body = `
        訂單編號：${orderId}
        客戶姓名：${orderDetails.customer.name}
        客戶電話：${orderDetails.customer.phone}

        商品：
        ${itemsString}

        折扣：$${orderDetails.discount.toFixed(2)}
        總價：$${orderDetails.total.toFixed(2)}

        請準備訂單以供取貨。
      `;
      MailApp.sendEmail(notifyEmails, subject, body);
    }

    return { success: true, orderId: orderId };
  } catch (error) {
    Logger.log(error);
    return {
      success: false,
      message: "Sorry, the service is not avaiable right now.",
    };
    // The second return statement here is unreachable and can be removed.
    // return { success: false, message: error.message };
  }
}