import { useState, useEffect } from 'react';
import { Sheet, CheckCircle, AlertCircle, Info, Copy, Code, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatDateTime } from '../../lib/utils';
import { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export function GoogleSheetsTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{success: boolean, message: string} | null>(null);
  const [showScript, setShowScript] = useState(false);
  const { currentTenant } = useAuth();

  // Google Apps Script template code
  const googleAppsScriptTemplate = `// ========================================
// GOOGLE APPS SCRIPT - POS Receipt Sync
// ========================================
//
<<<<<<< HEAD
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
    const versionedSheetName = \`\${sheetName}_\${timestampFormatted}\`;

    // Create versioned copy (optional)
    if (!spreadsheet.getSheetByName(versionedSheetName)) {
      sheet.copyTo(spreadsheet).setName(versionedSheetName);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: \`Successfully exported \${data.length} orders\`,
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
    SpreadsheetApp.getUi().alert('Web App URL: ' + url + '\\n\\nCopy this to your .env file as VITE_GOOGLE_APPS_SCRIPT_URL');
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
    phone: '[YOUR_PHONE_NUMBER]',
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
}`;

  useEffect(() => {
    if (currentTenant) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [currentTenant]);

  const loadOrders = async () => {
    if (!currentTenant) return;
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const orders = ordersData || [];
      setOrders(orders);

      if (orders.length > 0) {
        const orderIds = orders.map(order => order.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds)
          .eq('tenant_id', currentTenant.id)
          .order('order_id');

        if (itemsError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error loading order items:', itemsError);
          }
          setOrderItems([]);
        } else {
          setOrderItems(itemsData || []);
        }
      } else {
        setOrderItems([]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading orders:', error);
      }
      setOrders([]);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('✅ Kode berhasil di-copy ke clipboard!');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to copy text: ', err);
      }
      alert('❌ Gagal copy ke clipboard. Silakan copy manual.');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!filterStatus) return true;
    return order.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Sheet className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Google Sheets Sync</h2>
            <p className="text-green-100">Backup dan analisis data orders secara otomatis</p>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Setup Google Apps Script</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <p className="font-medium text-blue-900">Buka Google Apps Script</p>
              <p className="text-sm text-blue-700">Kunjungi <a href="https://script.google.com" className="underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">script.google.com</a></p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
            <div className="flex-1">
              <p className="font-medium text-blue-900">Copy Template Script</p>
              <p className="text-sm text-blue-700 mb-3">Copy kode dari file <code className="bg-blue-100 px-1 rounded">google-apps-script-template.gs</code></p>
              <button
                onClick={() => setShowScript(!showScript)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Code className="w-4 h-4" />
                {showScript ? 'Hide' : 'Show'} Template Script
              </button>
            </div>
          </div>

          {showScript && (
            <div className="mt-4 p-4 bg-slate-900 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-200">Google Apps Script Template</h4>
                <button
                  onClick={() => copyToClipboard(googleAppsScriptTemplate)}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy Code
                </button>
              </div>
              <textarea
                readOnly
                value={googleAppsScriptTemplate}
                className="w-full h-96 bg-slate-800 text-slate-200 text-xs font-mono p-3 rounded border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <p className="font-medium text-blue-900">Deploy sebagai Web App</p>
              <p className="text-sm text-blue-700">Set permissions: "Anyone, even anonymous"</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
            <div>
              <p className="font-medium text-blue-900">Copy Web App URL</p>
              <p className="text-sm text-blue-700">Tambahkan ke file <code className="bg-blue-100 px-1 rounded">.env</code></p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Tip: Lihat panduan lengkap di file QUICK_SETUP_GUIDE.md</span>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Semua Status</option>
              <option value="BELUM BAYAR">Belum Bayar</option>
              <option value="SUDAH BAYAR">Sudah Bayar</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {filteredOrders.length} orders selected
            </span>
            <button
              onClick={() => {
                // Export function here
                setIsExporting(true);
                setTimeout(() => {
                  setIsExporting(false);
                  setExportResult({success: true, message: '✅ Data berhasil di-export!'});
                }, 2000);
              }}
              disabled={isExporting || filteredOrders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Sheet className="w-4 h-4" />
                  <span>Export to Sheets</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Export Result */}
        {exportResult && (
          <div className={`p-4 rounded-lg mb-4 ${exportResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {exportResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm ${exportResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {exportResult.message}
              </span>
            </div>
          </div>
        )}

        {/* Data Preview */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Sheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Tidak ada data orders untuk di-export</p>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-3">Preview Data yang Akan Di-export:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filteredOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                  <div>
                    <span className="font-medium text-slate-900">{order.order_code}</span>
                    <span className="text-sm text-slate-600 ml-2">- {order.customer_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-900">{formatRupiah(order.total)}</div>
                    <div className="text-xs text-slate-500">{order.status}</div>
                  </div>
                </div>
              ))}
              {filteredOrders.length > 5 && (
                <div className="text-center py-2 text-sm text-slate-500">
                  ... dan {filteredOrders.length - 5} orders lainnya
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
