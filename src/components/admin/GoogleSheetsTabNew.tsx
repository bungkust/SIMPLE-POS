import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSelect, SelectItem } from '@/components/forms/FormSelect';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  Sheet, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Copy, 
  Code, 
  Settings,
  Download,
  Upload,
  ExternalLink,
  FileSpreadsheet,
  Database,
  Globe,
  Key,
  Play
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/form-utils';
import { googleSheetsSettingsSchema, type GoogleSheetsConfigData } from '@/lib/form-schemas';
import { useAppToast } from '@/components/ui/toast-provider';
import { useAuth } from '../../contexts/AuthContext';
import { Database as DB } from '../../lib/database.types';

type Order = DB['public']['Tables']['orders']['Row'];
type OrderItem = DB['public']['Tables']['order_items']['Row'];

export function GoogleSheetsTab() {
  const { currentTenant } = useAuth();
  const { showSuccess, showError } = useAppToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{success: boolean, message: string} | null>(null);
  const [showScript, setShowScript] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<GoogleSheetsConfigData>({
    resolver: zodResolver(googleSheetsSettingsSchema),
    defaultValues: {
      enabled: false,
      spreadsheet_id: '',
      sheet_name: 'Orders',
      webhook_url: '',
      api_key: '',
      sync_interval: 'daily',
      include_items: true,
      include_customer_info: true,
      include_payment_info: true
    }
  });

  const enabled = watch('enabled');
  const spreadsheetId = watch('spreadsheet_id');
  const webhookUrl = watch('webhook_url');

  useEffect(() => {
    if (currentTenant) {
      loadOrders();
      loadGoogleSheetsConfig();
    }
  }, [currentTenant]);

  const loadOrders = async () => {
    if (!currentTenant?.id) return;

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);

      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(order => order.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;
        setOrderItems(itemsData || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleSheetsConfig = async () => {
    if (!currentTenant?.id) return;

    try {
      // TODO: Fix tenant_settings table access - table doesn't exist
      // const { data, error } = await supabase
      //   .from('tenant_settings')
      //   .select('google_sheets_config')
      //   .eq('tenant_id', currentTenant.id)
      //   .single();

      // TODO: Use tenant.settings instead of tenant_settings table
      // if (error && error.code !== 'PGRST116' && error.code !== '42703') {
      //   console.error('Error loading Google Sheets config:', error);
      //   return;
      // }

      // // Handle missing column gracefully
      // if (error && error.code === '42703') {
      //   console.log('Google Sheets config column does not exist, using defaults');
      //   return;
      // }

      // if (data?.google_sheets_config) {
      //   const config = data.google_sheets_config;
      //   setValue('enabled', config.enabled || false);
      //   setValue('spreadsheet_id', config.spreadsheet_id || '');
      //   setValue('sheet_name', config.sheet_name || 'Orders');
      //   setValue('webhook_url', config.webhook_url || '');
      //   setValue('api_key', config.api_key || '');
      //   setValue('sync_interval', config.sync_interval || 'daily');
      //   setValue('include_items', config.include_items !== false);
      //   setValue('include_customer_info', config.include_customer_info !== false);
      //   setValue('include_payment_info', config.include_payment_info !== false);
      // }
    } catch (error) {
      console.error('Error loading Google Sheets config:', error);
    }
  };

  const onSubmit = async (data: GoogleSheetsConfigData) => {
    if (!currentTenant?.id) return;

    try {
      // TODO: Fix tenant_settings table access - table doesn't exist
      // const { error } = await supabase
      //   .from('tenant_settings')
      //   .upsert({
      //     tenant_id: currentTenant.id,
      //     google_sheets_config: {
      //       enabled: data.enabled,
      //       spreadsheet_id: data.spreadsheet_id,
      //       sheet_name: data.sheet_name,
      //       webhook_url: data.webhook_url,
      //       api_key: data.api_key,
      //       sync_interval: data.sync_interval,
      //       include_items: data.include_items,
      //       include_customer_info: data.include_customer_info,
      //       include_payment_info: data.include_payment_info,
      //     },
      //     updated_at: new Date().toISOString(),
      //   });

      // TODO: Use tenant.settings instead of tenant_settings table
      // if (error && error.code === '42703') {
      //   // Column doesn't exist, show success message anyway
      //   showSuccess('Settings Saved', 'Google Sheets configuration berhasil disimpan (mode demo).');
      //   return;
      // }

      // if (error) throw error;

      // showSuccess('Settings Saved', 'Google Sheets configuration berhasil disimpan.');
      
      // Temporary success message since tenant_settings table doesn't exist
      showSuccess('Settings Saved', 'Google Sheets configuration berhasil disimpan (mode demo).');
    } catch (error: any) {
      console.error('Error saving Google Sheets config:', error);
      showError('Save Failed', 'Gagal menyimpan konfigurasi Google Sheets.');
    }
  };

  const testConnection = async () => {
    if (!webhookUrl) {
      showError('No Webhook URL', 'Please enter a webhook URL first');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'testConnection',
          tenant_id: currentTenant?.id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        showSuccess('Connection Test', 'Successfully connected to Google Sheets!');
        setExportResult({ success: true, message: 'Connection test successful' });
      } else {
        showError('Connection Failed', result.error || 'Failed to connect to Google Sheets');
        setExportResult({ success: false, message: result.error || 'Connection failed' });
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      showError('Connection Error', 'Failed to test connection: ' + error.message);
      setExportResult({ success: false, message: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToGoogleSheets = async () => {
    if (!webhookUrl) {
      showError('No Webhook URL', 'Please configure Google Sheets integration first');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'exportOrders',
          tenant_id: currentTenant?.id,
          orders: orders.slice(0, 50), // Export last 50 orders
          order_items: orderItems,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        showSuccess('Export Successful', 'Orders exported to Google Sheets successfully!');
        setExportResult({ success: true, message: 'Export completed successfully' });
      } else {
        showError('Export Failed', result.error || 'Failed to export to Google Sheets');
        setExportResult({ success: false, message: result.error || 'Export failed' });
      }
    } catch (error: any) {
      console.error('Export error:', error);
      showError('Export Error', 'Failed to export orders: ' + error.message);
      setExportResult({ success: false, message: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied', 'Code copied to clipboard');
  };

  const googleAppsScriptTemplate = `// ========================================
// GOOGLE APPS SCRIPT - POS Receipt Sync
// ========================================
//
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. Create new project
// 3. Copy this code to Code.gs
// 4. Save and deploy as web app
// 5. Set permissions to "Anyone, even anonymous"
// 6. Copy the web app URL to your POS system

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    
    if (requestData.action === 'exportOrders') {
      return exportOrdersToSheet(requestData);
    }
    
    if (requestData.action === 'testConnection') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Connection successful'
      })).setMimeType(ContentService.MimeType.JSON);
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

function exportOrdersToSheet(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById('${spreadsheetId || 'YOUR_SPREADSHEET_ID'}');
    const sheet = spreadsheet.getSheetByName('${watch('sheet_name') || 'Orders'}') || spreadsheet.insertSheet('${watch('sheet_name') || 'Orders'}');
    
    // Clear existing data
    sheet.clear();
    
    // Add headers
    const headers = ['Order Code', 'Customer Name', 'Phone', 'Total', 'Payment Method', 'Status', 'Created At'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Add order data
    const orderData = data.orders.map(order => [
      order.order_code,
      order.customer_name,
      order.phone,
      order.total,
      order.payment_method,
      order.status,
      new Date(order.created_at)
    ]);
    
    if (orderData.length > 0) {
      sheet.getRange(2, 1, orderData.length, headers.length).setValues(orderData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Orders exported successfully',
      count: orderData.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Export error: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sheet className="h-5 w-5" />
            Google Sheets Integration
          </CardTitle>
          <CardDescription>
            Sync your orders and data with Google Sheets for reporting and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </TabsTrigger>
              <TabsTrigger value="script" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Script
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Setup Tab */}
              <TabsContent value="setup" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration</CardTitle>
                    <CardDescription>
                      Configure Google Sheets integration settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="enabled"
                        checked={enabled}
                        onChange={(e) => setValue('enabled', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="enabled">Enable Google Sheets Integration</Label>
                    </div>

                    {enabled && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            {...register('spreadsheet_id')}
                            label="Spreadsheet ID"
                            placeholder="Enter Google Sheets ID"
                            error={errors.spreadsheet_id?.message}
                            helperText="Found in the Google Sheets URL"
                          />

                          <FormInput
                            {...register('sheet_name')}
                            label="Sheet Name"
                            placeholder="Orders"
                            error={errors.sheet_name?.message}
                            helperText="Name of the sheet tab"
                          />
                        </div>

                        <FormInput
                          {...register('webhook_url')}
                          label="Webhook URL"
                          placeholder="https://script.google.com/macros/s/..."
                          error={errors.webhook_url?.message}
                          helperText="Google Apps Script web app URL"
                        />

                        <FormInput
                          {...register('api_key')}
                          label="API Key (Optional)"
                          placeholder="Enter API key if required"
                          error={errors.api_key?.message}
                          type="password"
                        />

                        <FormSelect
                          {...register('sync_interval')}
                          label="Sync Interval"
                          error={errors.sync_interval?.message}
                        >
                          <SelectItem value="realtime">Real-time</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </FormSelect>

                        <div className="space-y-2">
                          <Label>Export Options</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="include_items"
                                checked={watch('include_items')}
                                onChange={(e) => setValue('include_items', e.target.checked)}
                                className="rounded"
                              />
                              <Label htmlFor="include_items">Include Order Items</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="include_customer_info"
                                checked={watch('include_customer_info')}
                                onChange={(e) => setValue('include_customer_info', e.target.checked)}
                                className="rounded"
                              />
                              <Label htmlFor="include_customer_info">Include Customer Information</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="include_payment_info"
                                checked={watch('include_payment_info')}
                                onChange={(e) => setValue('include_payment_info', e.target.checked)}
                                className="rounded"
                              />
                              <Label htmlFor="include_payment_info">Include Payment Information</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testConnection}
                        disabled={!enabled || !webhookUrl || isExporting}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Test Connection
                      </Button>
                      <Button type="submit">
                        <Settings className="h-4 w-4 mr-2" />
                        Save Configuration
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Export Tab */}
              <TabsContent value="export" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export Orders</CardTitle>
                    <CardDescription>
                      Export your orders to Google Sheets
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Database className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Total Orders</p>
                              <p className="text-2xl font-bold">{orders.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">Ready to Export</p>
                              <p className="text-2xl font-bold">{Math.min(orders.length, 50)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">Last Export</p>
                              <p className="text-sm text-muted-foreground">
                                {exportResult ? (exportResult.success ? 'Success' : 'Failed') : 'Never'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {exportResult && (
                      <Alert className={exportResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        {exportResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <AlertDescription className={exportResult.success ? 'text-green-800' : 'text-red-800'}>
                          {exportResult.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-center">
                      <Button
                        onClick={exportToGoogleSheets}
                        disabled={!enabled || !webhookUrl || isExporting || orders.length === 0}
                        size="lg"
                      >
                        {isExporting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Export to Google Sheets
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Script Tab */}
              <TabsContent value="script" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Google Apps Script</CardTitle>
                    <CardDescription>
                      Copy this script to your Google Apps Script project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Setup Instructions:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                          <li>Go to <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">script.google.com</a></li>
                          <li>Create a new project</li>
                          <li>Copy the code below to Code.gs</li>
                          <li>Save and deploy as web app</li>
                          <li>Set permissions to "Anyone, even anonymous"</li>
                          <li>Copy the web app URL to the setup tab</li>
                        </ol>
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Google Apps Script Code</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(googleAppsScriptTemplate)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                          <code>{googleAppsScriptTemplate}</code>
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
