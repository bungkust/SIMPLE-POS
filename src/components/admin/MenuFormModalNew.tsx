import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSelect, SelectItem } from '@/components/forms/FormSelect';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Image, DollarSign, Tag, FileText, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { menuFormSchema, type MenuFormData } from '@/lib/form-schemas';
import { formatCurrency } from '@/lib/form-utils';
import { Database } from '@/lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface MenuFormModalProps {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
}

export function MenuFormModal({ item, categories, onClose, onSuccess, onError }: MenuFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentTenant } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<MenuFormData>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      price: item?.price || 0,
      category_id: item?.category_id || '',
      is_available: item?.is_active ?? true,
      image_url: item?.photo_url || '',
      preparation_time: item?.preparation_time || 0,
    }
  });

  const price = watch('price');
  const imageUrl = watch('image_url');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentTenant) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      onError({
        title: 'File Too Large',
        message: 'File terlalu besar. Maksimal 5MB.',
        details: 'Please choose a smaller image file.'
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError({
        title: 'Invalid File Type',
        message: 'File harus berupa gambar.',
        details: 'Please choose a valid image file (JPG, PNG, GIF, etc.).'
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `menu-items/${currentTenant.tenant_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setValue('image_url', publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      onError({
        title: 'Upload Failed',
        message: 'Gagal mengupload gambar.',
        details: error.message || 'Unknown error occurred during upload.'
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: MenuFormData) => {
    if (!currentTenant) {
      onError({
        title: 'No Tenant Context',
        message: 'Tenant context tidak ditemukan.',
        details: 'Please refresh the page and try again.'
      });
      return;
    }

    setLoading(true);
    try {
      const menuData = {
        tenant_id: currentTenant.tenant_id,
        name: data.name,
        description: data.description,
        price: data.price,
        category_id: data.category_id,
        photo_url: data.image_url || null,
        is_active: data.is_available,
        preparation_time: data.preparation_time || null,
        updated_at: new Date().toISOString(),
      };

      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update(menuData)
          .eq('id', item.id);

        if (error) throw error;

        onSuccess({
          title: 'Menu Item Updated',
          message: 'Menu item berhasil diperbarui.',
          type: 'success'
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert({
            ...menuData,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;

        onSuccess({
          title: 'Menu Item Created',
          message: 'Menu item baru berhasil dibuat.',
          type: 'success'
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      onError({
        title: 'Save Failed',
        message: 'Gagal menyimpan menu item.',
        details: error.message || 'Unknown error occurred.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {item ? 'Edit Menu Item' : 'Add New Menu Item'}
          </SheetTitle>
          <SheetDescription>
            {item 
              ? 'Update the menu item information'
              : 'Create a new menu item for your restaurant'
            }
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormInput
                {...register('name')}
                label="Item Name"
                placeholder="Enter menu item name"
                error={errors.name?.message}
                required
                disabled={loading}
              />

              <FormTextarea
                {...register('description')}
                label="Description"
                placeholder="Enter detailed description"
                error={errors.description?.message}
                disabled={loading}
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  {...register('price', { valueAsNumber: true })}
                  label="Price"
                  type="number"
                  placeholder="0"
                  error={errors.price?.message}
                  required
                  disabled={loading}
                  helperText={price ? `Price: ${formatCurrency(price)}` : undefined}
                />

                <FormInput
                  {...register('preparation_time', { valueAsNumber: true })}
                  label="Preparation Time (minutes)"
                  type="number"
                  placeholder="0"
                  error={errors.preparation_time?.message}
                  disabled={loading}
                  helperText="Estimated time to prepare this item"
                />
              </div>

              <FormSelect
                {...register('category_id')}
                label="Category"
                placeholder="Select a category"
                error={errors.category_id?.message}
                required
                disabled={loading}
              >
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </FormSelect>

              <FormCheckbox
                {...register('is_available')}
                label="Available for Order"
                disabled={loading}
              />
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="h-4 w-4" />
                Item Image
              </CardTitle>
              <CardDescription>
                Upload an image for this menu item (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>

              {imageUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Image uploaded
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? (
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
                  </div>
                  
                  {showPreview && (
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <img
                        src={imageUrl}
                        alt="Menu item preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Preview */}
          {price > 0 && (
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <strong>Price Preview:</strong> {formatCurrency(price)}
                {price < 10000 && (
                  <span className="text-amber-600 ml-2">
                    (Consider increasing price for better margins)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {item ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Tag className="h-4 w-4 mr-2" />
                  {item ? 'Update Item' : 'Create Item'}
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
