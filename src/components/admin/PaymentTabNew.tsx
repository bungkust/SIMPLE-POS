import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSelect, SelectItem } from '@/components/forms/FormSelect';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Upload, 
  Image, 
  CreditCard, 
  Smartphone, 
  Banknote,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-media-query';
import { paymentSettingsSchema, type PaymentSettingsData } from '@/lib/form-schemas';
import { useAppToast } from '@/components/ui/toast-provider';
import { uploadFile, uploadConfigs } from '@/lib/storage-utils';
import { logger } from '@/lib/logger';
interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  payment_type: 'TRANSFER' | 'QRIS' | 'COD';
  is_active: boolean;
  sort_order: number;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  qris_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export function PaymentTab() {
  const { currentTenant } = useAuth();
  const { showSuccess, showError } = useAppToast();
  const isMobile = useIsMobile();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showQRISPreview, setShowQRISPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Separate form for payment method
  const methodForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      payment_type: 'TRANSFER',
      account_holder: '',
      qris_image_url: ''
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<PaymentSettingsData>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      transfer_enabled: false,
      transfer_account: '',
      transfer_bank: '',
      qris_enabled: false,
      qris_code: '',
      cod_enabled: true,
    }
  });

  const transferEnabled = watch('transfer_enabled');
  const qrisEnabled = watch('qris_enabled');
  const codEnabled = watch('cod_enabled');

  useEffect(() => {
    if (currentTenant) {
      loadPaymentMethods();
      loadPaymentSettings();
    }
  }, [currentTenant]);

  // Populate form when editing a method
  useEffect(() => {
    if (editingMethod) {
      setValue('name', editingMethod.name);
      setValue('description', editingMethod.description);
      setValue('payment_type', editingMethod.payment_type);
      setValue('account_holder', editingMethod.account_holder || '');
      setValue('qris_image_url', editingMethod.qris_image_url || '');
    } else {
      // Reset form when not editing
      setValue('name', '');
      setValue('description', '');
      setValue('payment_type', '');
      setValue('account_holder', '');
      setValue('qris_image_url', '');
    }
  }, [editingMethod, setValue]);

  const loadPaymentMethods = async () => {
    if (!currentTenant?.id) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('sort_order', { ascending: true });

      if (error) {
        logger.error('Error loading payment methods:', error);
        showError('Error', 'Failed to load payment methods');
        return;
      }

      // Check and fix old QRIS URLs
      const methodsToUpdate = (data || []).filter(method => 
        method.payment_type === 'QRIS' && 
        method.qris_image_url && 
        method.qris_image_url.includes('store-icons/payment-methods/')
      );

      if (methodsToUpdate.length > 0) {
        logger.log('🔧 Found QRIS methods with old URLs, updating...');
        
        for (const method of methodsToUpdate) {
          const newUrl = method.qris_image_url.replace(
            'store-icons/payment-methods/',
            'qris-images/qris/'
          );
          
          logger.log(`🔄 Updating QRIS URL for method ${method.id}:`);
          logger.log(`  Old: ${method.qris_image_url}`);
          logger.log(`  New: ${newUrl}`);
          
          const { error: updateError } = await supabase
            .from('payment_methods')
            .update({ qris_image_url: newUrl })
            .eq('id', method.id);
          
          if (updateError) {
            logger.error(`❌ Error updating QRIS URL for method ${method.id}:`, updateError);
          } else {
            logger.log(`✅ Successfully updated QRIS URL for method ${method.id}`);
            // Update the method in the local array
            method.qris_image_url = newUrl;
          }
        }
      }

      setPaymentMethods(data || []);
      
      // Auto-update payment settings based on existing methods
      const hasTransfer = data?.some(m => m.payment_type === 'TRANSFER' && m.is_active) || false;
      const hasQRIS = data?.some(m => m.payment_type === 'QRIS' && m.is_active) || false;
      const hasCOD = data?.some(m => m.payment_type === 'COD' && m.is_active) || false;

      setValue('transfer_enabled', hasTransfer);
      setValue('qris_enabled', hasQRIS);
      setValue('cod_enabled', hasCOD);
    } catch (error) {
      logger.error('Unexpected error:', error);
      showError('Error', 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentSettings = async () => {
    // Payment settings are now auto-managed in loadPaymentMethods
    // Just set default values for other fields
    setValue('transfer_account', '');
    setValue('transfer_bank', '');
    setValue('qris_code', '');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentTenant) {
      logger.log('No file selected or no tenant');
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);
    
    try {
      // Use standardized upload utility with tenant-specific folder structure
      const result = await uploadFile(file, uploadConfigs.qrisImage(currentTenant.slug));

      if (result.success && result.url) {
        methodForm.setValue('qris_image_url', result.url);
        setUploadedFileName(file.name);
        setUploadProgress(100);
        showSuccess('Upload Success', 'Gambar QRIS berhasil diupload.');
        logger.log('✅ QRIS image uploaded successfully:', result.url);
      } else {
        showError('Upload Failed', `Gagal mengupload gambar QRIS: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      logger.error('Upload error:', error);
      showError('Upload Failed', `Gagal mengupload gambar QRIS: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingFile(false);
      setTimeout(() => setUploadProgress(0), 1000); // Reset progress after 1 second
    }
  };

  const onSubmit = async (data: PaymentSettingsData) => {
    if (!currentTenant?.id) return;

    try {
      logger.log('🔍 Saving payment settings:', data);
      
      // Safety check: Ensure at least one payment method type is enabled
      const enabledTypes = [data.transfer_enabled, data.qris_enabled, data.cod_enabled].filter(Boolean);
      if (enabledTypes.length === 0) {
        showError('Validation Error', 'Minimal harus ada 1 jenis payment method yang aktif.');
        return;
      }
      
      // Update payment methods based on toggle settings
      const updates = [];
      
      // Handle TRANSFER methods
      const transferMethods = paymentMethods.filter(m => m.payment_type === 'TRANSFER');
      
      if (transferMethods.length === 0 && data.transfer_enabled) {
        // Create default TRANSFER method if none exists and TRANSFER is enabled
        updates.push(
          supabase
            .from('payment_methods')
            .insert({
              tenant_id: currentTenant.id,
              name: 'Bank Transfer',
              description: 'Transfer to bank account',
              payment_type: 'TRANSFER',
              is_active: true,
              sort_order: paymentMethods.length,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
        );
      } else {
        // Update existing TRANSFER methods
        for (const method of transferMethods) {
          if (method.is_active !== data.transfer_enabled) {
            updates.push(
              supabase
                .from('payment_methods')
                .update({ 
                  is_active: data.transfer_enabled,
                  updated_at: new Date().toISOString()
                })
                .eq('id', method.id)
            );
          }
        }
      }
      
      // Handle QRIS methods
      const qrisMethods = paymentMethods.filter(m => m.payment_type === 'QRIS');
      
      if (qrisMethods.length === 0 && data.qris_enabled) {
        // Create default QRIS method if none exists and QRIS is enabled
        updates.push(
          supabase
            .from('payment_methods')
            .insert({
              tenant_id: currentTenant.id,
              name: 'QRIS Payment',
              description: 'Scan QR code to pay',
              payment_type: 'QRIS',
              is_active: true,
              sort_order: paymentMethods.length,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
        );
      } else {
        // Update existing QRIS methods
        for (const method of qrisMethods) {
          if (method.is_active !== data.qris_enabled) {
            updates.push(
              supabase
                .from('payment_methods')
                .update({ 
                  is_active: data.qris_enabled,
                  updated_at: new Date().toISOString()
                })
                .eq('id', method.id)
            );
          }
        }
      }
      
      // Handle COD methods
      const codMethods = paymentMethods.filter(m => m.payment_type === 'COD');
      
      if (codMethods.length === 0 && data.cod_enabled) {
        // Create default COD method if none exists and COD is enabled
        updates.push(
          supabase
            .from('payment_methods')
            .insert({
              tenant_id: currentTenant.id,
              name: 'Cash on Delivery',
              description: 'Payment upon delivery',
              payment_type: 'COD',
              is_active: true,
              sort_order: paymentMethods.length,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
        );
      } else {
        // Update existing COD methods
        for (const method of codMethods) {
          if (method.is_active !== data.cod_enabled) {
            updates.push(
              supabase
                .from('payment_methods')
                .update({ 
                  is_active: data.cod_enabled,
                  updated_at: new Date().toISOString()
                })
                .eq('id', method.id)
            );
          }
        }
      }
      
      // Execute all updates
      if (updates.length > 0) {
        logger.log(`🔍 Executing ${updates.length} payment method updates...`);
        const results = await Promise.all(updates);
        
        // Check for errors
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
          logger.error('❌ Some updates failed:', errors);
          throw new Error(`Failed to update ${errors.length} payment methods`);
        }
        
        logger.log('✅ All payment method updates successful');
      }
      
      // Reload payment methods to reflect changes
      await loadPaymentMethods();
      
      showSuccess('Settings Updated', 'Pengaturan pembayaran berhasil diperbarui.');
    } catch (error: any) {
      logger.error('Error updating payment settings:', error);
      showError('Update Failed', 'Gagal memperbarui pengaturan pembayaran.');
    }
  };

  const onSubmitMethod = async (data: any) => {
    console.log('🔍 onSubmitMethod called with data:', data);
    console.log('🔍 Current tenant:', currentTenant?.id);
    console.log('🔍 Editing method:', editingMethod?.id);
    
    if (!currentTenant?.id) {
      console.error('❌ No current tenant ID available');
      return;
    }

    logger.log('🔍 Form data received:', data);
    logger.log('🔍 Form data validation:');
    logger.log('  - name:', data.name, '(type:', typeof data.name, ')');
    logger.log('  - description:', data.description);
    logger.log('  - payment_type:', data.payment_type);
    logger.log('  - account_holder:', data.account_holder);
    logger.log('  - qris_image_url:', data.qris_image_url);

    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      showError('Validation Error', 'Payment method name is required.');
      return;
    }

    // Validate QRIS image upload
    if (data.payment_type === 'QRIS' && !data.qris_image_url) {
      showError('Validation Error', 'QRIS image is required for QRIS payment method.');
      return;
    }

    try {
      const methodData = {
        tenant_id: currentTenant.id,
        name: data.name,
        description: data.description,
        payment_type: data.payment_type,
        bank_name: null, // Removed field
        account_number: null, // Removed field
        account_holder: data.account_holder || null,
        qris_image_url: data.qris_image_url || null,
        is_active: true,
        sort_order: paymentMethods.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      logger.log('🔍 Saving payment method:');
      logger.log('  - Tenant ID:', currentTenant.id);
      logger.log('  - Method data:', methodData);
      logger.log('  - Editing method:', editingMethod?.id || 'new');

      if (editingMethod) {
        // Update existing method
        const { error } = await supabase
          .from('payment_methods')
          .update({
            ...methodData,
            id: editingMethod.id,
          })
          .eq('id', editingMethod.id);

        if (error) throw error;
        showSuccess('Method Updated', 'Payment method berhasil diperbarui.');
      } else {
        // Create new method
        const { error } = await supabase
          .from('payment_methods')
          .insert(methodData);

        if (error) throw error;
        showSuccess('Method Added', 'Payment method berhasil ditambahkan.');
      }

      setShowPaymentForm(false);
      setEditingMethod(null);
      await loadPaymentMethods();
    } catch (error: any) {
      logger.error('Error saving payment method:', error);
      
      if (error.code === '42501') {
        showError('Permission Error', 'Tidak memiliki izin untuk menyimpan payment method. Silakan hubungi administrator.');
      } else {
        showError('Save Failed', `Gagal menyimpan payment method: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDeleteMethod = async (method: PaymentMethod) => {
    try {
      // Check if this is the last active method being deleted
      if (method.is_active) {
        const activeMethods = paymentMethods.filter(m => m.is_active && m.id !== method.id);
        if (activeMethods.length === 0) {
          showError('Cannot Delete', 'Minimal harus ada 1 payment method yang aktif.');
          setShowDeleteDialog(false);
          setDeletingMethod(null);
          return;
        }
      }

      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', method.id);

      if (error) throw error;

      setShowDeleteDialog(false);
      setDeletingMethod(null);
      showSuccess('Method Deleted', 'Payment method berhasil dihapus.');
      
      // Reload payment methods to update settings automatically
      await loadPaymentMethods();
    } catch (error: any) {
      logger.error('Error deleting payment method:', error);
      showError('Delete Failed', 'Gagal menghapus payment method.');
    }
  };

  const toggleMethodStatus = async (method: PaymentMethod) => {
    try {
      // Check if this is the last active method being disabled
      if (method.is_active) {
        const activeMethods = paymentMethods.filter(m => m.is_active && m.id !== method.id);
        if (activeMethods.length === 0) {
          showError('Cannot Disable', 'Minimal harus ada 1 payment method yang aktif.');
          return;
        }
      }

      const { error } = await supabase
        .from('payment_methods')
        .update({ 
          is_active: !method.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', method.id);

      if (error) throw error;

      showSuccess('Status Updated', 'Payment method status berhasil diperbarui.');
      
      // Reload payment methods to update settings automatically
      await loadPaymentMethods();
    } catch (error: any) {
      logger.error('Error updating method status:', error);
      showError('Update Failed', 'Gagal memperbarui status payment method.');
    }
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'TRANSFER': return <CreditCard className="h-4 w-4" />;
      case 'QRIS': return <Smartphone className="h-4 w-4" />;
      case 'COD': return <Banknote className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Transfer</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transferEnabled ? 'Enabled' : 'Disabled'}
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentMethods.filter(m => m.payment_type === 'TRANSFER' && m.is_active).length} methods active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QRIS</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {qrisEnabled ? 'Enabled' : 'Disabled'}
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentMethods.filter(m => m.payment_type === 'QRIS' && m.is_active).length} methods active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash on Delivery</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {codEnabled ? 'Enabled' : 'Disabled'}
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentMethods.filter(m => m.payment_type === 'COD' && m.is_active).length} methods active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>
            Configure payment methods for your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Bank Transfer Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="transfer_enabled"
                  checked={transferEnabled}
                  onCheckedChange={(checked) => setValue('transfer_enabled', checked)}
                />
                <Label htmlFor="transfer_enabled" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Enable Bank Transfer
                </Label>
              </div>

            </div>

            <Separator />

            {/* QRIS Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="qris_enabled"
                  checked={qrisEnabled}
                  onCheckedChange={(checked) => setValue('qris_enabled', checked)}
                />
                <Label htmlFor="qris_enabled" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Enable QRIS Payment
                </Label>
              </div>
            </div>

            <Separator />

            {/* COD Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="cod_enabled"
                  checked={codEnabled}
                  onCheckedChange={(checked) => setValue('cod_enabled', checked)}
                />
                <Label htmlFor="cod_enabled" className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Enable Cash on Delivery
                </Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Payment Methods List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage individual payment methods
              </CardDescription>
            </div>
            <Button onClick={() => {
              setShowPaymentForm(true);
              setEditingMethod(null);
              // Reset form values
              methodForm.setValue('name', '');
              methodForm.setValue('description', '');
              methodForm.setValue('payment_type', 'TRANSFER');
              methodForm.setValue('account_holder', '');
              methodForm.setValue('qris_image_url', '');
              setUploadedFileName(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
              <p className="text-muted-foreground mb-4">
                Add payment methods to accept customer payments.
              </p>
              <Button onClick={() => setShowPaymentForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getPaymentIcon(method.payment_type)}
                      <div>
                        <h4 className="font-medium">{method.name}</h4>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                        {method.account_holder && (
                          <p className="text-xs text-muted-foreground">
                            Account Holder: {method.account_holder}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={method.is_active ? "default" : "secondary"}>
                      {method.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMethodStatus(method)}
                      title={method.is_active ? "Disable" : "Enable"}
                    >
                      {method.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('🔍 Edit button clicked for method:', method);
                        setEditingMethod(method);
                        setShowPaymentForm(true);
                        // Set form values
                        methodForm.setValue('name', method.name);
                        methodForm.setValue('description', method.description || '');
                        methodForm.setValue('payment_type', method.payment_type);
                        methodForm.setValue('account_holder', method.account_holder || '');
                        methodForm.setValue('qris_image_url', method.qris_image_url || '');
                        
                        console.log('🔍 Form values set:', {
                          name: method.name,
                          description: method.description || '',
                          payment_type: method.payment_type,
                          account_holder: method.account_holder || '',
                          qris_image_url: method.qris_image_url || ''
                        });
                        
                        // Set uploaded file name if there's an existing image
                        if (method.qris_image_url) {
                          setUploadedFileName('Existing QRIS Image');
                        } else {
                          setUploadedFileName(null);
                        }
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingMethod(method);
                        setShowDeleteDialog(true);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Form Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
            <DialogDescription>
              {editingMethod ? 'Update the payment method details.' : 'Add a new payment method for your customers.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={methodForm.handleSubmit(onSubmitMethod)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Bank Jago"
                  {...methodForm.register('name', { required: 'Name is required' })}
                />
                {methodForm.formState.errors.name && <p className="text-red-500 text-sm">{methodForm.formState.errors.name.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="payment_type">Payment Type</Label>
                <select
                  id="payment_type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  {...methodForm.register('payment_type', { required: 'Payment type is required' })}
                >
                  <option value="">Select type</option>
                  <option value="TRANSFER">Bank Transfer</option>
                  <option value="QRIS">QRIS</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
                {methodForm.formState.errors.payment_type && <p className="text-red-500 text-sm">{methodForm.formState.errors.payment_type.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Description of the payment method"
                rows={3}
                {...methodForm.register('description')}
              />
            </div>

            {/* Bank Transfer Fields - Only show when TRANSFER is selected */}
            {methodForm.watch('payment_type') === 'TRANSFER' && (
              <div>
                <Label htmlFor="account_holder">Account Holder</Label>
                <input
                  id="account_holder"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., John Doe"
                  {...methodForm.register('account_holder', { required: 'Account holder is required for bank transfer' })}
                />
                {methodForm.formState.errors.account_holder && <p className="text-red-500 text-sm">{methodForm.formState.errors.account_holder.message}</p>}
              </div>
            )}

            {/* QRIS Fields - Only show when QRIS is selected */}
            {methodForm.watch('payment_type') === 'QRIS' && (
              <div className="space-y-2">
                <Label>QRIS Image</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="qris-upload-method"
                    disabled={uploadingFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('qris-upload-method')?.click()}
                    disabled={uploadingFile}
                    className="flex-1"
                  >
                    {uploadingFile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Uploading...
                      </>
                    ) : uploadedFileName ? (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadedFileName}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload QRIS Image
                      </>
                    )}
                  </Button>
                  {methodForm.watch('qris_image_url') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQRISPreview(!showQRISPreview)}
                    >
                      {showQRISPreview ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {uploadingFile && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                {methodForm.watch('qris_image_url') && !uploadingFile && (
                  <div className="text-sm text-green-600 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Image uploaded successfully
                  </div>
                )}
                {methodForm.watch('qris_image_url') && showQRISPreview && (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <img
                      src={methodForm.watch('qris_image_url')}
                      alt="QRIS Code"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                    />
                  </div>
                )}
                {methodForm.formState.errors.qris_image_url && <p className="text-red-500 text-sm">{methodForm.formState.errors.qris_image_url.message}</p>}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentForm(false);
                  setEditingMethod(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingMethod ? 'Update Method' : 'Add Method'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingMethod?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingMethod && handleDeleteMethod(deletingMethod)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
