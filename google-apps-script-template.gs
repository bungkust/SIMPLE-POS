// ========================================
// GOOGLE APPS SCRIPT - POS Receipt Sync
// ========================================
// 
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. Create new project
// 3. Copy this code to Code.gs
// 4. Save and deploy as web app
// 5. Set permissions to "Anyone, even anonymous"
// 6. Copy the web app URL to .env file

function doPost(e) {
  try {
    // Parse incoming data
    const requestData = JSON.parse(e.postData.contents);
    
    if (requestData.action === 'exportOrders') {
      return exportOrdersToSheet(requestData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function exportOrdersToSheet(requestData) {
  try {
    const { data, sheetName, timestamp } = requestData;
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get or create sheet
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      // Add headers
      sheet.appendRow([
        'Order Code',
        'Tanggal',
        'Nama Customer',
        'No HP',
        'Items',
        'Total',
        'Metode Pembayaran',
        'Status'
      ]);
    }
    
    // Add data rows
    data.forEach(order => {
      sheet.appendRow([
        order.order_code,
        order.created_at,
        order.customer_name,
        order.phone,
        order.items,
        order.total,
        order.payment_method,
        order.status
      ]);
    });
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, 8);
    
    // Add timestamp to sheet name for versioning
    const timestampFormatted = new Date().toISOString().split('T')[0];
    const versionedSheetName = `${sheetName}_${timestampFormatted}`;
    
    // Create versioned copy (optional)
    if (!spreadsheet.getSheetByName(versionedSheetName)) {
      sheet.copyTo(spreadsheet).setName(versionedSheetName);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: `Successfully exported ${data.length} orders`,
      sheetName: sheetName,
      totalRows: sheet.getLastRow() - 1 // Subtract header row
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Export error: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// SETUP & DEPLOYMENT FUNCTIONS
// ========================================

function setupSheet() {
  // Run this function once to create initial sheet structure
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  
  // Set sheet name and headers
  sheet.setName('Orders');
  
  // Clear existing data
  
  // Add headers with formatting
  const headers = [
    'Order Code',
    'Tanggal',
    'Nama Customer',
    'No HP',
    'Items',
    'Total',
    'Metode Pembayaran',
    'Status'
  ];
  
  sheet.appendRow(headers);
  
  // Style headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f4f6');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  SpreadsheetApp.getUi().alert('✅ Orders sheet setup complete!');
}

function getWebAppURL() {
  // Run this to get the web app URL for .env file
  const url = ScriptApp.getService().getUrl();
  if (url) {
    SpreadsheetApp.getUi().alert('Web App URL: ' + url + '\n\nCopy this to your .env file as VITE_GOOGLE_APPS_SCRIPT_URL');
    return url;
  } else {
    SpreadsheetApp.getUi().alert('Web app not deployed yet. Please deploy first.');
  }
}

// ========================================
// TESTING FUNCTION
// ========================================

function testExport() {
  // Test data for development
  const testData = [{
    order_code: 'TEST001',
    created_at: '2025-01-01 10:00:00',
    customer_name: 'Test Customer',
    phone: '081234567890',
    items: 'Kopi Susu (2x); Cold Brew (1x)',
    total: 58000,
    payment_method: 'CASH',
    status: 'SUDAH BAYAR',
    exported_at: new Date().toISOString()
  }];
  
  const result = exportOrdersToSheet({
    data: testData,
    sheetName: 'Test_Orders',
    timestamp: new Date().toISOString()
  });
  
  Logger.log(result.getContent());
}
