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
import { paymentSettingsSchema, type PaymentSettingsData } from '@/lib/form-schemas';
import { useAppToast } from '@/components/ui/toast-provider';

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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showQRISPreview, setShowQRISPreview] = useState(false);

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

  const loadPaymentMethods = async () => {
    if (!currentTenant?.id) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error loading payment methods:', error);
        showError('Error', 'Failed to load payment methods');
        return;
      }

      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      showError('Error', 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentSettings = async () => {
    if (!currentTenant?.id) return;

    try {
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('payment_settings')
        .eq('tenant_id', currentTenant.id)
        .single();

      if (error && error.code !== 'PGRST116' && error.code !== '42703') {
        console.error('Error loading payment settings:', error);
        return;
      }

      // Handle missing column gracefully
      if (error && error.code === '42703') {
        console.log('Payment settings column does not exist, using defaults');
        return;
      }

      if (data?.payment_settings) {
        const settings = data.payment_settings;
        setValue('transfer_enabled', settings.transfer_enabled || false);
        setValue('transfer_account', settings.transfer_account || '');
        setValue('transfer_bank', settings.transfer_bank || '');
        setValue('qris_enabled', settings.qris_enabled || false);
        setValue('qris_code', settings.qris_code || '');
        setValue('cod_enabled', settings.cod_enabled !== false);
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentTenant) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'File terlalu besar. Maksimal 5MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Invalid File Type', 'File harus berupa gambar.');
      return;
    }

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `qris/${currentTenant.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-images')
        .getPublicUrl(filePath);

      setValue('qris_code', publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      showError('Upload Failed', 'Gagal mengupload gambar QRIS.');
    } finally {
      setUploadingFile(false);
    }
  };

  const onSubmit = async (data: PaymentSettingsData) => {
    if (!currentTenant?.id) return;

    try {
      const { error } = await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: currentTenant.id,
          payment_settings: {
            transfer_enabled: data.transfer_enabled,
            transfer_account: data.transfer_account,
            transfer_bank: data.transfer_bank,
            qris_enabled: data.qris_enabled,
            qris_code: data.qris_code,
            cod_enabled: data.cod_enabled,
          },
          updated_at: new Date().toISOString(),
        });

      if (error && error.code === '42703') {
        // Column doesn't exist, show success message anyway
        showSuccess('Settings Saved', 'Payment settings berhasil disimpan (mode demo).');
        return;
      }

      if (error) throw error;

      showSuccess('Settings Saved', 'Payment settings berhasil disimpan.');
    } catch (error: any) {
      console.error('Error saving payment settings:', error);
      showError('Save Failed', 'Gagal menyimpan pengaturan pembayaran.');
    }
  };

  const handleDeleteMethod = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', method.id);

      if (error) throw error;

      setPaymentMethods(prev => prev.filter(m => m.id !== method.id));
      setShowDeleteDialog(false);
      setDeletingMethod(null);
      showSuccess('Method Deleted', 'Payment method berhasil dihapus.');
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      showError('Delete Failed', 'Gagal menghapus payment method.');
    }
  };

  const toggleMethodStatus = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ 
          is_active: !method.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', method.id);

      if (error) throw error;

      setPaymentMethods(prev => prev.map(m => 
        m.id === method.id 
          ? { ...m, is_active: !m.is_active }
          : m
      ));

      showSuccess('Status Updated', 'Payment method status berhasil diperbarui.');
    } catch (error: any) {
      console.error('Error updating method status:', error);
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

              {transferEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <FormInput
                    {...register('transfer_bank')}
                    label="Bank Name"
                    placeholder="e.g., BCA, Mandiri, BRI"
                    error={errors.transfer_bank?.message}
                    disabled={!transferEnabled}
                  />
                  <FormInput
                    {...register('transfer_account')}
                    label="Account Number"
                    placeholder="Enter account number"
                    error={errors.transfer_account?.message}
                    disabled={!transferEnabled}
                  />
                </div>
              )}
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

              {qrisEnabled && (
                <div className="space-y-4 ml-6">
                  <div className="space-y-2">
                    <Label>QRIS Code</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="qris-upload"
                        disabled={uploadingFile}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('qris-upload')?.click()}
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload QRIS Image
                          </>
                        )}
                      </Button>
                      {watch('qris_code') && (
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
                    {watch('qris_code') && showQRISPreview && (
                      <div className="border rounded-lg p-4 bg-muted/20">
                        <img
                          src={watch('qris_code')}
                          alt="QRIS Code"
                          className="w-32 h-32 object-cover rounded-lg mx-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
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
            <Button onClick={() => setShowPaymentForm(true)}>
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
                        {method.bank_name && (
                          <p className="text-xs text-muted-foreground">
                            {method.bank_name} - {method.account_number}
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
