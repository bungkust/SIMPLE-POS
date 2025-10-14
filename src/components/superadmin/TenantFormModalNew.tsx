import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, Building2, Mail, User, MapPin, Phone, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { superAdminTenantFormSchema, type SuperAdminTenantFormData } from '@/lib/form-schemas';

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
        free_delivery_threshold: 0
      }
    }
  });

  // Load tenant data for editing
  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name || '',
        slug: tenant.slug || '',
        description: tenant.description || '',
        address: tenant.address || '',
        phone: tenant.phone || '',
        email: tenant.email || '',
        website: tenant.website || '',
        operating_hours: tenant.operating_hours || '',
        category: tenant.category || 'Restaurant',
        status: tenant.status || 'active',
        owner_email: tenant.owner_email || '',
        owner_name: tenant.owner_name || '',
        owner_phone: tenant.owner_phone || '',
        settings: tenant.settings as any || {
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
          free_delivery_threshold: 0
        }
      });

      if (tenant.logo_url) {
        setImagePreview(tenant.logo_url);
      }
    }
  }, [tenant, reset]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      onError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `tenant-logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('tenant-assets')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        onError('Failed to upload image');
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('tenant-assets')
        .getPublicUrl(filePath);

      setImagePreview(data.publicUrl);
      setValue('logo_url', data.publicUrl);
    } catch (error) {
      console.error('Image upload error:', error);
      onError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: SuperAdminTenantFormData) => {
    try {
      setIsSubmitting(true);
      console.log('🔄 TenantForm: Submitting tenant data:', data);

      const tenantData = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        operating_hours: data.operating_hours,
        category: data.category,
        status: data.status,
        owner_email: data.owner_email,
        owner_name: data.owner_name,
        owner_phone: data.owner_phone,
        logo_url: data.logo_url,
        settings: data.settings
      };

      if (isEditing && tenant) {
        // Update existing tenant
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', tenant.id);

        if (error) {
          console.error('❌ TenantForm: Error updating tenant:', error);
          onError(`Failed to update tenant: ${error.message}`);
          return;
        }

        console.log('✅ TenantForm: Tenant updated successfully');
      } else {
        // Create new tenant
        const { error } = await supabase
          .from('tenants')
          .insert([tenantData]);

        if (error) {
          console.error('❌ TenantForm: Error creating tenant:', error);
          onError(`Failed to create tenant: ${error.message}`);
          return;
        }

        console.log('✅ TenantForm: Tenant created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('❌ TenantForm: Unexpected error:', error);
      onError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}
