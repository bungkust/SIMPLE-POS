import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, Building2, Mail, User, MapPin, Phone, Clock, Instagram, MessageCircle, Twitter, Copy, Check, ExternalLink, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { superAdminTenantFormSchema, type SuperAdminTenantFormData } from '@/lib/form-schemas';
import { uploadFile, uploadConfigs, createTenantStorageStructure } from '@/lib/storage-utils';
import { logger } from '@/lib/logger';

type Tenant = Database['public']['Tables']['tenants']['Row'];

interface TenantFormModalProps {
  tenant?: Tenant | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function TenantFormModal({ tenant, onClose, onSuccess, onError }: TenantFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInvitationSuccess, setShowInvitationSuccess] = useState(false);

  const isEditing = !!tenant;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<SuperAdminTenantFormData>({
    resolver: zodResolver(superAdminTenantFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      operating_hours: '',
      category: 'Restaurant',
      status: 'active',
      owner_email: '',
      owner_name: '',
      owner_phone: '',
      social_media: {
        instagram: '',
        tiktok: '',
        twitter: '',
        facebook: ''
      },
      settings: {
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
        language: 'id',
        theme: 'light',
        notifications: true,
        email_notifications: true,
        sms_notifications: false,
        auto_accept_orders: false,
        require_phone_verification: false,
        allow_guest_checkout: true,
        minimum_order_amount: 0,
        delivery_fee: 0,
        free_delivery_threshold: 0,
        // Additional restaurant info fields
        rating: '',
        reviewCount: '',
        estimatedTime: '',
        distance: '',
        isOpen: true
      }
    }
  });

  // Load tenant data for editing
  useEffect(() => {
    if (tenant) {
      const settings = tenant.settings as any || {};
      reset({
        name: tenant.name || '',
        slug: tenant.slug || '',
        description: settings.description || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.website || '',
        operating_hours: settings.operating_hours || '',
        category: settings.category || 'Restaurant',
        status: tenant.is_active ? 'active' : 'inactive',
        owner_email: tenant.owner_email || '',
        owner_name: settings.owner_name || '',
        owner_phone: settings.owner_phone || '',
        logo_url: settings.logo_url || '',
        social_media: {
          instagram: settings.social_media?.instagram || '',
          tiktok: settings.social_media?.tiktok || '',
          twitter: settings.social_media?.twitter || '',
          facebook: settings.social_media?.facebook || ''
        },
        settings: {
          currency: settings.currency || 'IDR',
          timezone: settings.timezone || 'Asia/Jakarta',
          language: settings.language || 'id',
          theme: settings.theme || 'light',
          notifications: settings.notifications ?? true,
          email_notifications: settings.email_notifications ?? true,
          sms_notifications: settings.sms_notifications ?? false,
          auto_accept_orders: settings.auto_accept_orders ?? false,
          require_phone_verification: settings.require_phone_verification ?? false,
          allow_guest_checkout: settings.allow_guest_checkout ?? true,
          minimum_order_amount: settings.minimum_order_amount || 0,
          delivery_fee: settings.delivery_fee || 0,
          free_delivery_threshold: settings.free_delivery_threshold || 0,
          // Additional restaurant info fields
          rating: settings.rating || '',
          reviewCount: settings.reviewCount || '',
          estimatedTime: settings.estimatedTime || '',
          distance: settings.distance || '',
          isOpen: settings.isOpen ?? true
        }
      });

      if (settings.logo_url) {
        setImagePreview(settings.logo_url);
      }
    }
  }, [tenant, reset]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      
      // Get tenant slug from form or use temporary identifier
      const tenantSlug = watch('slug') || 'temp-tenant';
      
      // Use standardized upload utility with tenant-specific folder structure
      const result = await uploadFile(file, uploadConfigs.tenantLogo(tenantSlug));

      if (result.success && result.url) {
        setImagePreview(result.url);
        setValue('logo_url', result.url);
        logger.log('✅ Tenant logo uploaded successfully:', result.url);
      } else {
        onError(result.error || 'Failed to upload image');
      }
    } catch (error: any) {
      logger.error('Image upload error', { error: error.message, component: 'TenantFormModal' });
      onError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const copyToClipboard = async () => {
    if (!invitationLink) return;
    
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy to clipboard', { error: error.message, component: 'TenantFormModal' });
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = invitationLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInvitationSuccess = () => {
    setShowInvitationSuccess(false);
    setInvitationLink(null);
    onSuccess();
  };

  const onSubmit = async (data: SuperAdminTenantFormData) => {
    try {
      setIsSubmitting(true);
      logger.database('Submitting tenant data', { component: 'TenantFormModal', data: { name: data.name, slug: data.slug } });

      // Only submit fields that exist in the database schema
      const tenantData = {
        name: data.name,
        slug: data.slug,
        owner_email: data.owner_email,
        is_active: data.status === 'active',
        settings: {
          // Store additional form data in settings JSON field
          description: data.description,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          operating_hours: data.operating_hours,
          category: data.category,
          owner_name: data.owner_name,
          owner_phone: data.owner_phone,
          logo_url: data.logo_url,
          social_media: data.social_media,
          // Include the original settings
          ...data.settings
        }
      };

      if (isEditing && tenant) {
        // Update existing tenant
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', tenant.id);

        if (error) {
          logger.error('Error updating tenant', { error: error.message, component: 'TenantFormModal' });
          onError(`Failed to update tenant: ${error.message}`);
          return;
        }

        logger.database('Tenant updated successfully', { component: 'TenantFormModal' });
      } else {
        // Create new tenant
        const { data: newTenantData, error } = await supabase
          .from('tenants')
          .insert([tenantData])
          .select()
          .single();

        if (error) {
          logger.error('Error creating tenant', { error: error.message, component: 'TenantFormModal' });
          onError(`Failed to create tenant: ${error.message}`);
          return;
        }

        logger.database('Tenant created successfully', { component: 'TenantFormModal' });
        
        // Create storage folder structure for new tenant
        try {
          await createTenantStorageStructure(data.slug);
          logger.log('✅ Storage structure created for new tenant:', data.slug);
        } catch (storageError) {
          logger.error('⚠️ Failed to create storage structure, but tenant was created:', storageError);
          // Don't fail the entire operation if storage structure creation fails
        }

        // Generate invitation link for new tenant
        const baseUrl = import.meta.env.VITE_SITE_URL;
        
        console.log('🔍 DEBUG - VITE_SITE_URL:', import.meta.env.VITE_SITE_URL);
        console.log('🔍 DEBUG - window.location.origin:', window.location.origin);
        
        if (!baseUrl) {
          logger.error('VITE_SITE_URL not configured, using window.location.origin', { component: 'TenantFormModal' });
          // Show warning to user in production
          if (import.meta.env.PROD) {
            alert('WARNING: Site URL not configured. Please contact administrator.');
          }
        }
        
        const finalUrl = baseUrl || window.location.origin;
        console.log('🔍 DEBUG - baseUrl used:', finalUrl);
        const invitationLink = `${finalUrl}/${data.slug}/admin/setup?token=${newTenantData.id}`;
        setInvitationLink(invitationLink);
        setShowInvitationSuccess(true);
        return; // Don't call onSuccess() yet, show invitation dialog first
      }

      onSuccess();
    } catch (error) {
      logger.error('Unexpected error in tenant form', { error: error.message, component: 'TenantFormModal' });
      onError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {isEditing ? 'Edit Tenant' : 'Add New Tenant'}
            </SheetTitle>
            <SheetDescription>
              {isEditing 
                ? 'Update tenant information and settings' 
                : 'Create a new tenant for the platform'
              }
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Essential tenant details and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-200">
                      <img 
                        src={imagePreview} 
                        alt="Logo preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {uploadingImage && (
                      <p className="text-sm text-slate-500 mt-1">Uploading...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Name and Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tenant Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter tenant name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    placeholder="tenant-slug"
                    className={errors.slug ? 'border-red-500' : ''}
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-600">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Brief description of the tenant"
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Category and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Restaurant">Restaurant</SelectItem>
                      <SelectItem value="Cafe">Cafe</SelectItem>
                      <SelectItem value="Bakery">Bakery</SelectItem>
                      <SelectItem value="Food Truck">Food Truck</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
              <CardDescription>
                Business contact details and location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  placeholder="Business address"
                  rows={2}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Phone number"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Business email"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...register('website')}
                  placeholder="https://example.com"
                  className={errors.website ? 'border-red-500' : ''}
                />
                {errors.website && (
                  <p className="text-sm text-red-600">{errors.website.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="operating_hours">Operating Hours</Label>
                <Input
                  id="operating_hours"
                  {...register('operating_hours')}
                  placeholder="e.g., Mon-Fri 8AM-10PM, Sat-Sun 9AM-11PM"
                  className={errors.operating_hours ? 'border-red-500' : ''}
                />
                {errors.operating_hours && (
                  <p className="text-sm text-red-600">{errors.operating_hours.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Restaurant Information</CardTitle>
              <CardDescription>
                Additional restaurant details for public display
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    {...register('settings.rating')}
                    placeholder="4.8"
                    className={errors.settings?.rating ? 'border-red-500' : ''}
                  />
                  {errors.settings?.rating && (
                    <p className="text-sm text-red-600">{errors.settings.rating.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewCount">Review Count</Label>
                  <Input
                    id="reviewCount"
                    {...register('settings.reviewCount')}
                    placeholder="127 reviews"
                    className={errors.settings?.reviewCount ? 'border-red-500' : ''}
                  />
                  {errors.settings?.reviewCount && (
                    <p className="text-sm text-red-600">{errors.settings.reviewCount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Time</Label>
                  <Input
                    id="estimatedTime"
                    {...register('settings.estimatedTime')}
                    placeholder="15-20 menit"
                    className={errors.settings?.estimatedTime ? 'border-red-500' : ''}
                  />
                  {errors.settings?.estimatedTime && (
                    <p className="text-sm text-red-600">{errors.settings.estimatedTime.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distance">Distance</Label>
                  <Input
                    id="distance"
                    {...register('settings.distance')}
                    placeholder="1.2 km"
                    className={errors.settings?.distance ? 'border-red-500' : ''}
                  />
                  {errors.settings?.distance && (
                    <p className="text-sm text-red-600">{errors.settings.distance.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isOpen">Restaurant Status</Label>
                <Select onValueChange={(value) => setValue('settings.isOpen', value === 'true')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Open</SelectItem>
                    <SelectItem value="false">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Social Media Links</CardTitle>
              <CardDescription>
                Connect your social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-muted-foreground" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    {...register('social_media.instagram')}
                    placeholder="https://instagram.com/yourhandle"
                    className={errors.social_media?.instagram ? 'border-red-500' : ''}
                  />
                  {errors.social_media?.instagram && (
                    <p className="text-sm text-red-600">{errors.social_media.instagram.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-black" />
                    TikTok
                  </Label>
                  <Input
                    id="tiktok"
                    {...register('social_media.tiktok')}
                    placeholder="https://tiktok.com/@yourhandle"
                    className={errors.social_media?.tiktok ? 'border-red-500' : ''}
                  />
                  {errors.social_media?.tiktok && (
                    <p className="text-sm text-red-600">{errors.social_media.tiktok.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-muted-foreground" />
                    X (Twitter)
                  </Label>
                  <Input
                    id="twitter"
                    {...register('social_media.twitter')}
                    placeholder="https://x.com/yourhandle"
                    className={errors.social_media?.twitter ? 'border-red-500' : ''}
                  />
                  {errors.social_media?.twitter && (
                    <p className="text-sm text-red-600">{errors.social_media.twitter.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    {...register('social_media.facebook')}
                    placeholder="https://facebook.com/yourpage"
                    className={errors.social_media?.facebook ? 'border-red-500' : ''}
                  />
                  {errors.social_media?.facebook && (
                    <p className="text-sm text-red-600">{errors.social_media.facebook.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Owner Information</CardTitle>
              <CardDescription>
                Primary contact and account holder details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_name">Owner Name</Label>
                  <Input
                    id="owner_name"
                    {...register('owner_name')}
                    placeholder="Owner full name"
                    className={errors.owner_name ? 'border-red-500' : ''}
                  />
                  {errors.owner_name && (
                    <p className="text-sm text-red-600">{errors.owner_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_email">Owner Email *</Label>
                  <Input
                    id="owner_email"
                    type="email"
                    {...register('owner_email')}
                    placeholder="owner@example.com"
                    className={errors.owner_email ? 'border-red-500' : ''}
                  />
                  {errors.owner_email && (
                    <p className="text-sm text-red-600">{errors.owner_email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_phone">Owner Phone</Label>
                <Input
                  id="owner_phone"
                  {...register('owner_phone')}
                  placeholder="Owner phone number"
                  className={errors.owner_phone ? 'border-red-500' : ''}
                />
                {errors.owner_phone && (
                  <p className="text-sm text-red-600">{errors.owner_phone.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Tenant' : 'Create Tenant')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    {/* Invitation Success Dialog */}
    {showInvitationSuccess && invitationLink && (
      <Dialog open={showInvitationSuccess} onOpenChange={setShowInvitationSuccess}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" />
              Tenant Berhasil Dibuat!
            </DialogTitle>
            <DialogDescription>
              Tenant baru telah berhasil dibuat. Kirim link invitation ini ke owner untuk setup akun admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Owner Email Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Owner Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{watch('owner_email')}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Kirim link invitation ini ke email owner untuk setup password dan akses admin dashboard.
                </p>
              </CardContent>
            </Card>

            {/* Invitation Link */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invitation Link</CardTitle>
                <CardDescription>
                  Link ini akan mengarahkan owner ke halaman setup password untuk tenant baru.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <code className="flex-1 text-sm break-all">{invitationLink}</code>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => window.open(invitationLink, '_blank')}
                    variant="outline"
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cara Menggunakan</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Copy link invitation di atas</li>
                  <li>Kirim link tersebut ke email owner: <strong>{watch('owner_email')}</strong></li>
                  <li>Owner akan mengklik link dan diarahkan ke halaman setup password</li>
                  <li>Setelah setup selesai, owner bisa login ke admin dashboard</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowInvitationSuccess(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleInvitationSuccess}
              className="bg-green-600 hover:bg-green-700"
            >
              Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}
