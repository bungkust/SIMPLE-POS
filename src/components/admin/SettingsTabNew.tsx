import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Coffee, 
  Store, 
  ShoppingBag, 
  Utensils, 
  Save, 
  RotateCcw, 
  Upload, 
  X,
  Settings,
  Image,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { settingsFormSchema, type SettingsFormData } from '@/lib/form-schemas';
import { useAppToast } from '@/components/ui/toast-provider';
import { uploadFile, uploadConfigs } from '@/lib/storage-utils';
import { logger } from '@/lib/logger';
const iconOptions = [
  { value: 'Coffee', label: 'Coffee', icon: Coffee },
  { value: 'Store', label: 'Store', icon: Store },
  { value: 'ShoppingBag', label: 'Shopping Bag', icon: ShoppingBag },
  { value: 'Utensils', label: 'Utensils', icon: Utensils },
];

export function SettingsTab() {
  const { config, updateConfig } = useConfig();
  const { currentTenant } = useAuth();
  const { showSuccess, showError } = useAppToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLogoPreview, setShowLogoPreview] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      storeName: config.storeName || '',
      storeIcon: config.storeIcon || '',
      storeIconType: config.storeIconType || 'Coffee',
      storeDescription: config.storeDescription || '',
      storeAddress: config.storeAddress || '',
      storePhone: config.storePhone || '',
      storeEmail: config.storeEmail || '',
      storeHours: config.storeHours || '',
      autoAcceptOrders: config.autoAcceptOrders || false,
      requirePhoneVerification: config.requirePhoneVerification || false,
      allowGuestCheckout: config.allowGuestCheckout || true,
      minimumOrderAmount: config.minimumOrderAmount || 0,
      deliveryFee: config.deliveryFee || 0,
      freeDeliveryThreshold: config.freeDeliveryThreshold || 0,
    }
  });

  const storeIcon = watch('storeIcon');
  const storeIconType = watch('storeIconType');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentTenant) return;

    setUploading(true);
    try {
      // Use standardized upload utility with tenant-specific folder structure
      const result = await uploadFile(file, uploadConfigs.storeLogo(currentTenant.id));

      if (result.success && result.url) {
        setValue('storeIcon', result.url);
        showSuccess('Upload Success', 'Logo toko berhasil diupload.');
        logger.log('✅ Store logo uploaded successfully:', result.url);
      } else {
        showError('Upload Failed', `Gagal mengupload logo toko: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      logger.error('Upload error:', error);
      showError('Upload Failed', 'Gagal mengupload logo toko.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true);
    try {
      updateConfig({
        storeName: data.storeName,
        storeIcon: data.storeIcon,
        storeIconType: data.storeIconType,
        storeDescription: data.storeDescription,
        storeAddress: data.storeAddress,
        storePhone: data.storePhone,
        storeEmail: data.storeEmail,
        storeHours: data.storeHours,
        autoAcceptOrders: data.autoAcceptOrders,
        requirePhoneVerification: data.requirePhoneVerification,
        allowGuestCheckout: data.allowGuestCheckout,
        minimumOrderAmount: data.minimumOrderAmount,
        deliveryFee: data.deliveryFee,
        freeDeliveryThreshold: data.freeDeliveryThreshold,
      });

      showSuccess('Settings Saved', 'Pengaturan toko berhasil disimpan.');
    } catch (error: any) {
      logger.error('Error saving settings:', error);
      showError('Save Failed', 'Gagal menyimpan pengaturan toko.');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    reset({
      storeName: '',
      storeIcon: '',
      storeIconType: 'Coffee',
      storeDescription: '',
      storeAddress: '',
      storePhone: '',
      storeEmail: '',
      storeHours: '',
      autoAcceptOrders: false,
      requirePhoneVerification: false,
      allowGuestCheckout: true,
      minimumOrderAmount: 0,
      deliveryFee: 0,
      freeDeliveryThreshold: 0,
    });
  };

  const getIconComponent = (iconType: string) => {
    const option = iconOptions.find(opt => opt.value === iconType);
    return option ? option.icon : Coffee;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Store Settings
          </CardTitle>
          <CardDescription>
            Configure your store information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Orders
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* General Settings */}
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Store Information</CardTitle>
                    <CardDescription>
                      Basic information about your store
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        {...register('storeName')}
                        label="Store Name"
                        placeholder="Enter store name"
                        error={errors.storeName?.message}
                        required
                        disabled={loading}
                      />

                      <FormSelect
                        {...register('storeIconType')}
                        label="Store Icon"
                        error={errors.storeIconType?.message}
                        required
                        disabled={loading}
                      >
                        {iconOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </FormSelect>
                    </div>

                    <FormTextarea
                      {...register('storeDescription')}
                      label="Store Description"
                      placeholder="Describe your store..."
                      error={errors.storeDescription?.message}
                      disabled={loading}
                      rows={3}
                    />

                    <div className="space-y-2">
                      <Label>Store Logo</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading || loading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading || loading}
                        >
                          {uploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </>
                          )}
                        </Button>
                        {storeIcon && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLogoPreview(!showLogoPreview)}
                          >
                            {showLogoPreview ? (
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
                      {storeIcon && showLogoPreview && (
                        <div className="border rounded-lg p-4 bg-muted/20">
                          <img
                            src={storeIcon}
                            alt="Store logo"
                            className="w-24 h-24 object-cover rounded-lg mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        {...register('storeAddress')}
                        label="Store Address"
                        placeholder="Enter store address"
                        error={errors.storeAddress?.message}
                        disabled={loading}
                      />

                      <FormInput
                        {...register('storePhone')}
                        label="Phone Number"
                        placeholder="Enter phone number"
                        error={errors.storePhone?.message}
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        {...register('storeEmail')}
                        label="Email"
                        type="email"
                        placeholder="Enter email address"
                        error={errors.storeEmail?.message}
                        disabled={loading}
                      />

                      <FormInput
                        {...register('storeHours')}
                        label="Store Hours"
                        placeholder="e.g., Mon-Fri 8AM-10PM"
                        error={errors.storeHours?.message}
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                </Card>

              </TabsContent>



              {/* Order Settings */}
              <TabsContent value="orders" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Management</CardTitle>
                    <CardDescription>
                      Configure order processing and customer requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Auto Accept Orders</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically accept new orders without manual approval
                          </p>
                        </div>
                        <Switch
                          checked={watch('autoAcceptOrders')}
                          onCheckedChange={(checked) => setValue('autoAcceptOrders', checked)}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Require Phone Verification</Label>
                          <p className="text-sm text-muted-foreground">
                            Require phone number verification for all orders
                          </p>
                        </div>
                        <Switch
                          checked={watch('requirePhoneVerification')}
                          onCheckedChange={(checked) => setValue('requirePhoneVerification', checked)}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Allow Guest Checkout</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow customers to order without creating an account
                          </p>
                        </div>
                        <Switch
                          checked={watch('allowGuestCheckout')}
                          onCheckedChange={(checked) => setValue('allowGuestCheckout', checked)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Limits & Fees</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormInput
                        {...register('minimumOrderAmount', { valueAsNumber: true })}
                        label="Minimum Order Amount"
                        type="number"
                        placeholder="0"
                        error={errors.minimumOrderAmount?.message}
                        disabled={loading}
                        helperText="Minimum amount for order placement"
                      />

                      <FormInput
                        {...register('deliveryFee', { valueAsNumber: true })}
                        label="Delivery Fee"
                        type="number"
                        placeholder="0"
                        error={errors.deliveryFee?.message}
                        disabled={loading}
                        helperText="Standard delivery fee"
                      />

                      <FormInput
                        {...register('freeDeliveryThreshold', { valueAsNumber: true })}
                        label="Free Delivery Threshold"
                        type="number"
                        placeholder="0"
                        error={errors.freeDeliveryThreshold?.message}
                        disabled={loading}
                        helperText="Order amount for free delivery"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <Separator />

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetToDefaults}
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
