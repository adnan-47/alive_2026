// ============================================================
// ALIVE 2025 – Google Apps Script Backend
// Copy this entire code into Google Apps Script
// ============================================================

// STEP 1: Create a new Google Sheet
// STEP 2: Go to Extensions > Apps Script
// STEP 3: Paste this entire code
// STEP 4: Click Deploy > New Deployment > Web App
//         - Execute as: Me
//         - Who has access: Anyone
// STEP 5: Copy the Web App URL into index.html (SCRIPT_URL)

// ============== CONFIGURATION ==============
const SHEET_NAME = "Registrations";
const DRIVE_FOLDER_NAME = "ALIVE2025_Receipts";
// ===========================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Name", "Age", "Class", "School", "Address",
        "Zone", "Unit", "Phone", "WhatsApp",
        "Parent Name", "Parent Phone", "Receipt URL", "Timestamp"
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#b5e32a").setFontColor("#111111");
      sheet.setFrozenRows(1);
    }

    // Upload receipt image to Google Drive
    let receiptUrl = "";
    if (data.receipt && data.receipt.startsWith("data:")) {
      try {
        const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
        const base64Data = data.receipt.split(",")[1];
        const mimeType = data.receipt.split(";")[0].split(":")[1];
        const ext = mimeType === "application/pdf" ? ".pdf" :
                    mimeType === "image/png" ? ".png" : ".jpg";
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, data.name + "_receipt" + ext);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        receiptUrl = file.getUrl();
      } catch (uploadErr) {
        receiptUrl = "Upload failed: " + uploadErr.message;
      }
    }

    // Append row to sheet
    sheet.appendRow([
      data.name || "",
      data.age || "",
      data.class || "",
      data.school || "",
      data.address || "",
      data.zone || "",
      data.unit || "",
      data.phone || "",
      data.whatsapp || "",
      data.parentName || "",
      data.parentPhone || "",
      receiptUrl,
      data.timestamp || new Date().toLocaleString("en-IN")
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;

  if (action === "get") {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ rows: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const data = sheet.getDataRange().getValues();
      const rows = data.slice(1); // Skip header row

      return ContentService
        .createTextOutput(JSON.stringify({ rows: rows }))
        .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Default: return status
  return ContentService
    .createTextOutput(JSON.stringify({ status: "alive", project: "ALIVE 2025" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}
