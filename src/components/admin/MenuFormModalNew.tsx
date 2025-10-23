import React, { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSelect, SelectItem } from '@/components/forms/FormSelect';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Image, DollarSign, Tag, FileText, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { menuFormSchema, type MenuFormData } from '@/lib/form-schemas';
import { formatCurrency } from '@/lib/form-utils';
import { Database } from '@/lib/database.types';
import { uploadFile, uploadConfigs } from '@/lib/storage-utils';
import { logger } from '@/lib/logger';
import { colors, typography, components, sizes, spacing, cn } from '@/lib/design-system';
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentTenant } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control
  } = useForm<MenuFormData>({
    resolver: zodResolver(menuFormSchema) as any,
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      price: item?.price || 0,
      category_id: item?.category_id || '',
      image_url: item?.photo_url || '',
      is_available: item?.is_active ?? true,
      // preparation_time field removed as it doesn't exist in database schema
    }
  });

  const price = watch('price');
  const imageUrl = watch('image_url');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('🔍 handleFileUpload called:', { file: file?.name, size: file?.size, type: file?.type });
    
    // Clear previous upload success message
    setUploadSuccess(false);
    
    if (!file) {
      console.log('🔍 No file selected');
      return;
    }

    setUploading(true);
    try {
      // Get tenant slug from currentTenant or use temporary identifier
      const tenantSlug = currentTenant?.slug || 'temp-tenant';
      
      // Use standardized upload utility with tenant-specific folder structure
      const result = await uploadFile(file, uploadConfigs.menuItem(tenantSlug));

      if (result.success && result.url) {
        setValue('image_url', result.url);
        setHasUnsavedChanges(true);
        setUploadSuccess(true);
        logger.log('✅ Menu item image uploaded successfully', { url: result.url });
        
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        onError({
          title: 'Upload Gagal',
          message: 'Gagal mengupload gambar.',
          details: result.error || 'Terjadi kesalahan saat mengupload file.'
        });
      }
    } catch (error: any) {
      logger.error('Upload error:', error);
      onError({
        title: 'Upload Gagal',
        message: 'Gagal mengupload gambar.',
        details: error.message || 'Terjadi kesalahan saat mengupload file.'
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: MenuFormData) => {
    if (!currentTenant) {
      onError({
        title: 'Konteks Tenant Tidak Ditemukan',
        message: 'Tenant context tidak ditemukan.',
        details: 'Silakan refresh halaman dan coba lagi.'
      });
      return;
    }

    setLoading(true);
    try {
      const menuData = {
        tenant_id: currentTenant.id,
        name: data.name,
        description: data.description,
        price: data.price,
        category_id: data.category_id,
        photo_url: data.image_url || null,
        is_active: true, // New items are active by default, can be toggled via menu list
        base_price: data.price, // Set base_price same as price initially
        short_description: data.description ? data.description.substring(0, 100) : null, // Truncate description for short_description
        search_text: `${data.name} ${data.description || ''}`.toLowerCase(), // Create search text for filtering
        // preparation_time field doesn't exist in database schema, removing it
        updated_at: new Date().toISOString(),
      };

      if (item) {
        // Update existing item
        const { error } = await (supabase as any)
          .from('menu_items')
          .update(menuData)
          .eq('id', item.id);

        if (error) throw error;

        onSuccess({
          title: 'Menu Berhasil Diperbarui',
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
          } as any);

        if (error) throw error;

        onSuccess({
          title: 'Menu Berhasil Dibuat',
          message: 'Menu item baru berhasil dibuat.',
          type: 'success'
        });
      }

      setHasUnsavedChanges(false);
      onClose();
    } catch (error: any) {
      logger.error('Error saving menu item:', error);
      onError({
        title: 'Simpan Gagal',
        message: 'Gagal menyimpan menu item.',
        details: error.message || 'Terjadi kesalahan saat menyimpan data.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className={cn(components.sheet, "w-full sm:max-w-2xl overflow-y-auto")}>
        <SheetHeader className={components.sheetHeader}>
          <SheetTitle className={cn(typography.h3, "flex items-center gap-2")}>
            <Tag className={sizes.icon.md} />
            {item ? 'Edit Menu Item' : 'Add New Menu Item'}
          </SheetTitle>
          <SheetDescription className={typography.body.medium}>
            {item 
              ? 'Update the menu item information'
              : 'Create a new menu item for your restaurant'
            }
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className={cn(spacing.lg, "mt-6")}>
          {/* Basic Information */}
          <Card className={components.card}>
            <CardHeader className={components.sheetHeader}>
              <CardTitle className={cn(typography.h4, "flex items-center gap-2")}>
                <FileText className={sizes.icon.sm} />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(components.sheetContent, spacing.md)}>
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

              <div className={cn(components.grid.cols2, "gap-4")}>
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

                {/* Preparation time field removed as it doesn't exist in database schema */}
              </div>

              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    label="Category"
                    placeholder="Select a category"
                    error={errors.category_id?.message}
                    required
                    disabled={loading}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </FormSelect>
                )}
              />

            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card className={components.card}>
            <CardHeader className={components.sheetHeader}>
              <CardTitle className={cn(typography.h4, "flex items-center gap-2")}>
                <Image className={sizes.icon.sm} />
                Item Image
              </CardTitle>
              <CardDescription className={typography.body.small}>
                Upload an image for this menu item (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(components.sheetContent, spacing.md)}>
              <div className={spacing.sm}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading || loading}
                  style={{ display: 'none' }}
                  id="menu-image-upload"
                />
                <label htmlFor="menu-image-upload" className="w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('🔍 Upload button clicked, fileInputRef:', fileInputRef.current);
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      console.log('🔍 Upload button touch end, fileInputRef:', fileInputRef.current);
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    disabled={uploading || loading}
                    className={cn(components.buttonOutline, "w-full cursor-pointer")}
                  >
                    {uploading ? (
                      <>
                        <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 mr-2", colors.primary.DEFAULT)}></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className={cn(sizes.icon.md, "mr-2")} />
                        Choose Image
                      </>
                    )}
                  </Button>
                </label>
                <p className={cn(typography.body.small, colors.text.muted)}>
                  Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
                {uploadSuccess && (
                  <div className={cn(typography.body.small, colors.status.info.text, "font-medium")}>
                    ✅ Image uploaded successfully! Don't forget to save the form.
                  </div>
                )}
              </div>

              {imageUrl && (
                <div className={spacing.sm}>
                  <div className={cn(components.flex.between)}>
                    <Badge 
                      variant={hasUnsavedChanges ? "default" : "outline"} 
                      className={cn(
                        typography.body.medium,
                        hasUnsavedChanges ? cn(colors.status.info.bg, colors.status.info.text, colors.status.info.border) : ""
                      )}
                    >
                      {hasUnsavedChanges ? "Image uploaded" : "Image uploaded"}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? (
                        <>
                          <EyeOff className={cn(sizes.icon.sm, "mr-1")} />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className={cn(sizes.icon.sm, "mr-1")} />
                          Preview
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {showPreview && (
                    <div className={cn(components.card, "p-4", colors.background.muted)}>
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
            <Alert className={cn(colors.status.info.bg, colors.status.info.border, "border")}>
              <DollarSign className={cn(sizes.icon.sm, colors.status.info.icon)} />
              <AlertDescription className={colors.status.info.text}>
                <strong>Price Preview:</strong> {formatCurrency(price)}
                {price < 10000 && (
                  <span className={cn(colors.text.yellow, "ml-2")}>
                    (Consider increasing price for better margins)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className={cn(components.flex.end, "space-x-3")}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className={cn(components.buttonOutline, sizes.button.md)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className={cn(
                hasUnsavedChanges ? 'bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md' : components.buttonPrimary,
                sizes.button.md
              )}
            >
              {loading ? (
                <>
                  <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 mr-2", colors.primary.foreground)}></div>
                  {item ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Tag className={cn(sizes.icon.sm, "mr-2")} />
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
