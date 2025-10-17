import { supabase } from './supabase';
import { logger } from './logger';

export interface UploadConfig {
  bucket: string;
  folder: string;
  tenantId?: string;
  tenantSlug?: string;
  maxSize?: number; // in bytes, default 5MB
  allowedTypes?: string[]; // default ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Standardized multi-tenant file upload utility
 * Creates tenant-specific folder structure: {tenantSlug}/{folder}/{filename}
 */
export async function uploadFile(
  file: File,
  config: UploadConfig
): Promise<UploadResult> {
  try {
    // Validate file size
    const maxSize = config.maxSize || 5 * 1024 * 1024; // 5MB default
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    // Validate file type
    const allowedTypes = config.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only image files are allowed.'
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Create tenant-specific folder structure
    let tenantIdentifier: string;
    if (config.tenantSlug) {
      tenantIdentifier = config.tenantSlug;
    } else if (config.tenantId) {
      // If we only have tenantId, we need to get the slug from database
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('slug')
        .eq('id', config.tenantId)
        .single();

      if (tenantError || !tenantData) {
        return {
          success: false,
          error: 'Unable to identify tenant for upload'
        };
      }
      tenantIdentifier = (tenantData as any).slug;
    } else {
      return {
        success: false,
        error: 'Tenant identifier (tenantId or tenantSlug) is required'
      };
    }

    // Create file path: {tenantSlug}/{folder}/{filename}
    const filePath = `${tenantIdentifier}/${config.folder}/${fileName}`;

    logger.log('🔍 Upload details:', {
      bucket: config.bucket,
      filePath,
      fileName,
      fileSize: file.size,
      fileType: file.type,
      tenantIdentifier
    });

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(config.bucket)
      .upload(filePath, file);

    if (uploadError) {
      logger.error('Upload error:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(filePath);

    logger.log('✅ Upload successful:', {
      publicUrl: data.publicUrl,
      filePath
    });

    return {
      success: true,
      url: data.publicUrl
    };

  } catch (error: any) {
    logger.error('Unexpected upload error:', error);
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
}

/**
 * Predefined upload configurations for different use cases
 */
export const uploadConfigs = {
  // Tenant logo upload (Super Admin)
  tenantLogo: (tenantSlug: string): UploadConfig => ({
    bucket: 'store-icons',
    folder: 'logo',
    tenantSlug
  }),

  // Store logo upload (Admin Settings) - Use same structure as super admin
  storeLogo: (tenantSlug: string): UploadConfig => ({
    bucket: 'store-icons',
    folder: 'logo',
    tenantSlug
  }),

  // Menu item image upload
  menuItem: (tenantSlug: string): UploadConfig => ({
    bucket: 'menu-images',
    folder: 'menu-items',
    tenantSlug
  }),

  // QRIS image upload
  qrisImage: (tenantSlug: string): UploadConfig => ({
    bucket: 'qris-images',
    folder: 'qris',
    tenantSlug
  })
};

/**
 * Helper function to get tenant slug from tenant ID
 */
export async function getTenantSlug(tenantId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', tenantId)
      .single();

    if (error || !data) {
      logger.error('Error getting tenant slug:', error as any);
      return null;
    }

    return (data as any).slug;
  } catch (error) {
    logger.error('Unexpected error getting tenant slug:', error as any);
    return null;
  }
}

/**
 * Ensure tenant folders exist in all storage buckets
 * This creates placeholder files to establish the folder structure
 */
export async function ensureTenantFolders(tenantSlug: string): Promise<boolean> {
  try {
    logger.log('🔧 Ensuring tenant folders exist for:', tenantSlug as any);

    const buckets = [
      { bucket: 'store-icons', folder: 'logo' },
      { bucket: 'menu-images', folder: 'menu-items' },
      { bucket: 'qris-images', folder: 'qris' }
    ];

    for (const { bucket, folder } of buckets) {
      try {
        // Create a placeholder file to establish the folder structure
        const placeholderPath = `${tenantSlug}/${folder}/.gitkeep`;
        const placeholderContent = new Blob([''], { type: 'text/plain' });

        // Check if folder already exists by listing files
        const { data: existingFiles, error: listError } = await supabase.storage
          .from(bucket)
          .list(`${tenantSlug}/${folder}`, { limit: 1 });

        if (listError && listError.message.includes('not found')) {
          // Folder doesn't exist, create it with a placeholder
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(placeholderPath, placeholderContent);

          if (uploadError) {
            logger.error(`Failed to create folder ${tenantSlug}/${folder} in ${bucket}:`, uploadError as any);
          } else {
            logger.log(`✅ Created folder ${tenantSlug}/${folder} in ${bucket}` as any);
          }
        } else if (existingFiles) {
          logger.log(`✅ Folder ${tenantSlug}/${folder} already exists in ${bucket}` as any);
        }
      } catch (error) {
        logger.error(`Error ensuring folder ${tenantSlug}/${folder} in ${bucket}:`, error as any);
      }
    }

    return true;
  } catch (error) {
    logger.error('Error ensuring tenant folders:', error as any);
    return false;
  }
}

/**
 * Create tenant folders when a new tenant is created
 * This should be called after successfully creating a tenant
 */
export async function createTenantStorageStructure(tenantSlug: string): Promise<void> {
  try {
    logger.log('🏗️ Creating storage structure for new tenant:', tenantSlug as any);
    await ensureTenantFolders(tenantSlug);
    logger.log('✅ Tenant storage structure created successfully');
  } catch (error) {
    logger.error('❌ Failed to create tenant storage structure:', error as any);
    throw error;
  }
}

/**
 * Delete all tenant storage folders and files
 * This should be called when a tenant is deleted
 */
export async function deleteTenantStorageStructure(tenantSlug: string): Promise<void> {
  try {
    logger.log('🗑️ Deleting storage structure for tenant:', tenantSlug as any);

    const buckets = [
      { bucket: 'store-icons', folder: 'logo' },
      { bucket: 'menu-images', folder: 'menu-items' },
      { bucket: 'qris-images', folder: 'qris' }
    ];

    for (const { bucket, folder } of buckets) {
      try {
        // List all files in the tenant's folder
        const { data: files, error: listError } = await supabase.storage
          .from(bucket)
          .list(`${tenantSlug}/${folder}`);

        if (listError && !listError.message.includes('not found')) {
          logger.error(`Error listing files in ${bucket}/${tenantSlug}/${folder}:`, listError as any);
          continue;
        }

        if (files && files.length > 0) {
          // Delete all files in the folder
          const filePaths = files.map(file => `${tenantSlug}/${folder}/${file.name}`);
          
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove(filePaths);

          if (deleteError) {
            logger.error(`Error deleting files from ${bucket}/${tenantSlug}/${folder}:`, deleteError as any);
          } else {
            logger.log(`✅ Deleted ${files.length} files from ${bucket}/${tenantSlug}/${folder}` as any);
          }
        } else {
          logger.log(`ℹ️ No files found in ${bucket}/${tenantSlug}/${folder}` as any);
        }
      } catch (error) {
        logger.error(`Error cleaning up ${bucket}/${tenantSlug}/${folder}:`, error as any);
      }
    }

    logger.log('✅ Tenant storage structure deleted successfully');
  } catch (error) {
    logger.error('❌ Failed to delete tenant storage structure:', error as any);
    throw error;
  }
}
