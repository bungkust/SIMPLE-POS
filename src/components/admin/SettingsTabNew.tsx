import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  Save, 
  RotateCcw, 
  Upload, 
  X,
  Settings,
  Image,
  Clock,
  Phone,
  Mail,
  Eye,
  EyeOff,
  ShoppingBag,
  Utensils
} from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-media-query';
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
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLogoPreview, setShowLogoPreview] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
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
      socialMedia: {
        instagram: config.socialMedia?.instagram || '',
        tiktok: config.socialMedia?.tiktok || '',
        twitter: config.socialMedia?.twitter || '',
        facebook: config.socialMedia?.facebook || '',
      },
      headerDisplaySettings: {
        showOperatingHours: config.headerDisplaySettings?.showOperatingHours ?? true,
        showAddress: config.headerDisplaySettings?.showAddress ?? true,
        showPhone: config.headerDisplaySettings?.showPhone ?? true,
        showSocialMedia: config.headerDisplaySettings?.showSocialMedia ?? true,
      },
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
      const result = await uploadFile(file, uploadConfigs.storeLogo(currentTenant.slug));

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
    console.log('🔧 onSubmit triggered with data:', data);
    console.log('🔧 Form validation errors:', errors);
    console.log('🔧 Form is valid:', Object.keys(errors).length === 0);
    console.log('🔧 Form isValid:', isValid);
    console.log('🔧 Form isDirty:', isDirty);
    console.log('🔧 Current tenant:', currentTenant);
    console.log('🔧 updateConfig function:', typeof updateConfig);
    
    setLoading(true);
    try {
      console.log('🔧 Calling updateConfig...');
      await updateConfig({
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
        socialMedia: data.socialMedia,
        headerDisplaySettings: data.headerDisplaySettings,
      });

      showSuccess('Settings Saved', 'Pengaturan toko berhasil disimpan.');
    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      logger.error('Error saving settings:', error);
      showError('Save Failed', 'Gagal menyimpan pengaturan toko.');
    } finally {
      setLoading(false);
    }
  };

  // Sync form with config changes only when config is first loaded
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (config.storeName && !isInitialized) { // Only reset if config has data and not initialized
      reset({
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
        socialMedia: {
          instagram: config.socialMedia?.instagram || '',
          tiktok: config.socialMedia?.tiktok || '',
          twitter: config.socialMedia?.twitter || '',
          facebook: config.socialMedia?.facebook || '',
        },
        headerDisplaySettings: {
          showOperatingHours: config.headerDisplaySettings?.showOperatingHours ?? true,
          showAddress: config.headerDisplaySettings?.showAddress ?? true,
          showPhone: config.headerDisplaySettings?.showPhone ?? true,
          showSocialMedia: config.headerDisplaySettings?.showSocialMedia ?? true,
        },
      });
      setIsInitialized(true);
    }
  }, [config.storeName, reset, isInitialized]);

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
      socialMedia: {
        instagram: '',
        tiktok: '',
        twitter: '',
        facebook: '',
      },
      headerDisplaySettings: {
        showOperatingHours: true,
        showAddress: true,
        showPhone: true,
        showSocialMedia: true,
      },
    });
  };

  const getIconComponent = (iconType: string) => {
    const option = iconOptions.find(opt => opt.value === iconType);
    return option ? option.icon : Coffee;
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden mobile-container">
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Store Settings
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Kelola pengaturan toko dan preferensi
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {isMobile ? (
            <Accordion type="single" collapsible defaultValue="general" className="w-full">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-full overflow-hidden">
                <AccordionItem value="general">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    General Settings
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Store Information</CardTitle>
                    <CardDescription>
                      Basic information about your store
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                      <FormInput
                        {...register('storeName')}
                        label="Store Name"
                        placeholder="Enter store name"
                        error={errors.storeName?.message}
                        required
                        disabled={loading}
                        className={isMobile ? 'w-full' : ''}
                      />

                      <FormSelect
                        {...register('storeIconType')}
                        label="Store Icon"
                        error={errors.storeIconType?.message}
                        required
                        disabled={loading}
                        className={isMobile ? 'w-full' : ''}
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
                      className={isMobile ? 'w-full' : ''}
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
                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                      <FormInput
                        {...register('storeAddress')}
                        label="Store Address"
                        placeholder="Enter store address"
                        error={errors.storeAddress?.message}
                        disabled={loading}
                        className={isMobile ? 'w-full' : ''}
                      />

                      <FormInput
                        {...register('storePhone')}
                        label="Phone Number"
                        placeholder="Enter phone number"
                        error={errors.storePhone?.message}
                        disabled={loading}
                        className={isMobile ? 'w-full' : ''}
                      />
                    </div>

                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                      <FormInput
                        {...register('storeEmail')}
                        label="Email"
                        type="email"
                        placeholder="Enter email address"
                        error={errors.storeEmail?.message}
                        disabled={loading}
                        className={isMobile ? 'w-full' : ''}
                      />

                      <FormInput
                        {...register('storeHours')}
                        label="Store Hours"
                        placeholder="e.g., Mon-Fri 8AM-10PM"
                        error={errors.storeHours?.message}
                        disabled={loading}
                        className={isMobile ? 'w-full' : ''}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Social Media Links</CardTitle>
                    <CardDescription>
                      Add your social media profiles to connect with customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                      <FormInput
                        {...register('socialMedia.instagram')}
                        label="Instagram"
                        placeholder="https://instagram.com/yourusername"
                        error={errors.socialMedia?.instagram?.message}
                        disabled={loading}
                        helperText="Your Instagram profile URL"
                        className={isMobile ? 'w-full' : ''}
                      />

                      <FormInput
                        {...register('socialMedia.tiktok')}
                        label="TikTok"
                        placeholder="https://tiktok.com/@yourusername"
                        error={errors.socialMedia?.tiktok?.message}
                        disabled={loading}
                        helperText="Your TikTok profile URL"
                        className={isMobile ? 'w-full' : ''}
                      />
                    </div>

                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                      <FormInput
                        {...register('socialMedia.twitter')}
                        label="X (Twitter)"
                        placeholder="https://x.com/yourusername"
                        error={errors.socialMedia?.twitter?.message}
                        disabled={loading}
                        helperText="Your X (Twitter) profile URL"
                        className={isMobile ? 'w-full' : ''}
                      />

                      <FormInput
                        {...register('socialMedia.facebook')}
                        label="Facebook"
                        placeholder="https://facebook.com/yourusername"
                        error={errors.socialMedia?.facebook?.message}
                        disabled={loading}
                        helperText="Your Facebook profile URL"
                        className={isMobile ? 'w-full' : ''}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Header Display Settings</CardTitle>
                    <CardDescription>
                      Choose which information to display in the restaurant header
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="showOperatingHours">Operating Hours & Status</Label>
                          <p className="text-sm text-muted-foreground">
                            Show restaurant operating hours and open/closed status
                          </p>
                        </div>
                        <Switch
                          id="showOperatingHours"
                          checked={watch('headerDisplaySettings.showOperatingHours') ?? true}
                          onCheckedChange={(checked) => setValue('headerDisplaySettings.showOperatingHours', checked)}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="showAddress">Restaurant Address</Label>
                          <p className="text-sm text-muted-foreground">
                            Show restaurant address with location icon
                          </p>
                        </div>
                        <Switch
                          id="showAddress"
                          checked={watch('headerDisplaySettings.showAddress') ?? true}
                          onCheckedChange={(checked) => setValue('headerDisplaySettings.showAddress', checked)}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="showPhone">Phone Number</Label>
                          <p className="text-sm text-muted-foreground">
                            Show restaurant phone number for contact
                          </p>
                        </div>
                        <Switch
                          id="showPhone"
                          checked={watch('headerDisplaySettings.showPhone') ?? true}
                          onCheckedChange={(checked) => setValue('headerDisplaySettings.showPhone', checked)}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="showSocialMedia">Social Media Links</Label>
                          <p className="text-sm text-muted-foreground">
                            Show social media links (Instagram, TikTok, Twitter, Facebook)
                          </p>
                        </div>
                        <Switch
                          id="showSocialMedia"
                          checked={watch('headerDisplaySettings.showSocialMedia') ?? true}
                          onCheckedChange={(checked) => setValue('headerDisplaySettings.showSocialMedia', checked)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                </AccordionContent>
                </AccordionItem>

                <AccordionItem value="orders">
                  <AccordionTrigger className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Order Settings
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6">
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
                    <CardDescription>
                      Set minimum order values and delivery charges
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormInput
                      {...register('minimumOrderAmount', { valueAsNumber: true })}
                      label="Minimum Order Amount"
                      type="number"
                      placeholder="0"
                      error={errors.minimumOrderAmount?.message}
                      disabled={loading}
                      helperText="Minimum amount required for an order"
                      className={isMobile ? 'w-full' : ''}
                    />

                    <FormInput
                      {...register('deliveryFee', { valueAsNumber: true })}
                      label="Delivery Fee"
                      type="number"
                      placeholder="0"
                      error={errors.deliveryFee?.message}
                      disabled={loading}
                      helperText="Standard delivery fee"
                      className={isMobile ? 'w-full' : ''}
                    />

                    <FormInput
                      {...register('freeDeliveryThreshold', { valueAsNumber: true })}
                      label="Free Delivery Threshold"
                      type="number"
                      placeholder="0"
                      error={errors.freeDeliveryThreshold?.message}
                      disabled={loading}
                      helperText="Order amount for free delivery"
                      className={isMobile ? 'w-full' : ''}
                    />
                  </CardContent>
                </Card>
                  </AccordionContent>
                </AccordionItem>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetToDefaults}
                    disabled={loading}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
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
            </Accordion>
          ) : (
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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-full overflow-hidden">
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
                        placeholder="Brief description of your store"
                        error={errors.storeDescription?.message}
                        disabled={loading}
                        rows={3}
                      />

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
                          label="Store Phone"
                          placeholder="Enter phone number"
                          error={errors.storePhone?.message}
                          disabled={loading}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                          {...register('storeEmail')}
                          label="Store Email"
                          type="email"
                          placeholder="Enter email address"
                          error={errors.storeEmail?.message}
                          disabled={loading}
                        />

                        <FormInput
                          {...register('storeHours')}
                          label="Operating Hours"
                          placeholder="e.g., Mon-Fri 9AM-6PM"
                          error={errors.storeHours?.message}
                          disabled={loading}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Social Media Links</CardTitle>
                      <CardDescription>
                        Add your social media profiles to connect with customers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                          {...register('socialMedia.instagram')}
                          label="Instagram"
                          placeholder="https://instagram.com/yourusername"
                          error={errors.socialMedia?.instagram?.message}
                          disabled={loading}
                          helperText="Your Instagram profile URL"
                        />

                        <FormInput
                          {...register('socialMedia.tiktok')}
                          label="TikTok"
                          placeholder="https://tiktok.com/@yourusername"
                          error={errors.socialMedia?.tiktok?.message}
                          disabled={loading}
                          helperText="Your TikTok profile URL"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                          {...register('socialMedia.twitter')}
                          label="X (Twitter)"
                          placeholder="https://x.com/yourusername"
                          error={errors.socialMedia?.twitter?.message}
                          disabled={loading}
                          helperText="Your X (Twitter) profile URL"
                        />

                        <FormInput
                          {...register('socialMedia.facebook')}
                          label="Facebook"
                          placeholder="https://facebook.com/yourusername"
                          error={errors.socialMedia?.facebook?.message}
                          disabled={loading}
                          helperText="Your Facebook profile URL"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Header Display Settings</CardTitle>
                      <CardDescription>
                        Choose which information to display in the restaurant header
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="showOperatingHours-desktop">Operating Hours & Status</Label>
                            <p className="text-sm text-muted-foreground">
                              Show restaurant operating hours and open/closed status
                            </p>
                          </div>
                          <Switch
                            id="showOperatingHours-desktop"
                            checked={watch('headerDisplaySettings.showOperatingHours') ?? true}
                            onCheckedChange={(checked) => setValue('headerDisplaySettings.showOperatingHours', checked)}
                            disabled={loading}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="showAddress-desktop">Restaurant Address</Label>
                            <p className="text-sm text-muted-foreground">
                              Show restaurant address with location icon
                            </p>
                          </div>
                          <Switch
                            id="showAddress-desktop"
                            checked={watch('headerDisplaySettings.showAddress') ?? true}
                            onCheckedChange={(checked) => setValue('headerDisplaySettings.showAddress', checked)}
                            disabled={loading}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="showPhone-desktop">Phone Number</Label>
                            <p className="text-sm text-muted-foreground">
                              Show restaurant phone number for contact
                            </p>
                          </div>
                          <Switch
                            id="showPhone-desktop"
                            checked={watch('headerDisplaySettings.showPhone') ?? true}
                            onCheckedChange={(checked) => setValue('headerDisplaySettings.showPhone', checked)}
                            disabled={loading}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="showSocialMedia-desktop">Social Media Links</Label>
                            <p className="text-sm text-muted-foreground">
                              Show social media icons and links
                            </p>
                          </div>
                          <Switch
                            id="showSocialMedia-desktop"
                            checked={watch('headerDisplaySettings.showSocialMedia') ?? true}
                            onCheckedChange={(checked) => setValue('headerDisplaySettings.showSocialMedia', checked)}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Limits & Fees</CardTitle>
                      <CardDescription>
                        Set minimum order values and delivery charges
                      </CardDescription>
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
                              Allow customers to place orders without creating an account
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
