import { Database } from './database.types';

// Type definitions for normalized tenant data
export type TenantInfo = Database['public']['Tables']['tenant_info']['Row'];
export type TenantInfoInsert = Database['public']['Tables']['tenant_info']['Insert'];
export type TenantInfoUpdate = Database['public']['Tables']['tenant_info']['Update'];

export type Tenant = Database['public']['Tables']['tenants']['Row'];

// Combined type for tenant with related info
export interface TenantWithInfo extends Tenant {
  tenant_info: TenantInfo | null;
}

// Type for tenant configuration data that maps to AppConfig
export interface TenantConfigData {
  // Store information
  storeName: string;
  storeDescription?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeHours?: string;
  storeIcon?: string;
  storeIconType?: 'predefined' | 'uploaded';
  
  // System settings
  currency?: string;
  language?: string;
  
  // Social media links
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
  };
  
  // Header display settings
  headerDisplaySettings?: {
    showOperatingHours?: boolean;
    showAddress?: boolean;
    showPhone?: boolean;
    showSocialMedia?: boolean;
  };
  
  // Order settings (still from tenants.settings for now)
  autoAcceptOrders?: boolean;
  requirePhoneVerification?: boolean;
  allowGuestCheckout?: boolean;
  minimumOrderAmount?: number;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
}

// Helper function to map tenant_info to TenantConfigData
export function mapTenantInfoToConfig(tenant: Tenant, tenantInfo: TenantInfo | null): TenantConfigData {
  const settings = tenant.settings || {};
  
  return {
    // Store information
    storeName: tenant.name,
    storeDescription: tenantInfo?.description || undefined,
    storeAddress: tenantInfo?.address || undefined,
    storePhone: tenantInfo?.phone || undefined,
    storeEmail: tenantInfo?.email || undefined,
    storeHours: tenantInfo?.operating_hours || undefined,
    storeIcon: tenantInfo?.logo_url || undefined,
    storeIconType: tenantInfo?.logo_url ? 'uploaded' : 'predefined',
    
    // System settings
    currency: tenantInfo?.currency || 'IDR',
    language: tenantInfo?.language || 'id',
    
    // Social media links
    socialMedia: {
      instagram: tenantInfo?.instagram_url || undefined,
      tiktok: tenantInfo?.tiktok_url || undefined,
      twitter: tenantInfo?.twitter_url || undefined,
      facebook: tenantInfo?.facebook_url || undefined,
    },
    
    // Header display settings
    headerDisplaySettings: {
      showOperatingHours: tenantInfo?.show_operating_hours ?? true,
      showAddress: tenantInfo?.show_address ?? true,
      showPhone: tenantInfo?.show_phone ?? true,
      showSocialMedia: tenantInfo?.show_social_media ?? true,
    },
    
    // Order settings (from tenants.settings for now)
    autoAcceptOrders: settings.auto_accept_orders || false,
    requirePhoneVerification: settings.require_phone_verification || false,
    allowGuestCheckout: settings.allow_guest_checkout ?? true,
    minimumOrderAmount: settings.minimum_order_amount || 0,
    deliveryFee: settings.delivery_fee || 0,
    freeDeliveryThreshold: settings.free_delivery_threshold || 0,
  };
}

// Helper function to map AppConfig to tenant_info insert/update
export function mapConfigToTenantInfo(
  tenantId: string, 
  config: Partial<TenantConfigData>
): TenantInfoInsert {
  return {
    tenant_id: tenantId,
    description: config.storeDescription || null,
    address: config.storeAddress || null,
    phone: config.storePhone || null,
    email: config.storeEmail || null,
    operating_hours: config.storeHours || null,
    logo_url: config.storeIconType === 'uploaded' ? config.storeIcon || null : null,
    currency: config.currency || 'IDR',
    language: config.language || 'id',
    instagram_url: config.socialMedia?.instagram || null,
    tiktok_url: config.socialMedia?.tiktok || null,
    twitter_url: config.socialMedia?.twitter || null,
    facebook_url: config.socialMedia?.facebook || null,
    show_operating_hours: config.headerDisplaySettings?.showOperatingHours ?? true,
    show_address: config.headerDisplaySettings?.showAddress ?? true,
    show_phone: config.headerDisplaySettings?.showPhone ?? true,
    show_social_media: config.headerDisplaySettings?.showSocialMedia ?? true,
  };
}

// Validation functions
export function validateSocialMediaUrl(url: string | undefined): boolean {
  if (!url) return true; // Empty URLs are valid
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateEmail(email: string | undefined): boolean {
  if (!email) return true; // Empty emails are valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string | undefined): boolean {
  if (!phone) return true; // Empty phones are valid
  const phoneRegex = /^[+]?[\d\s\-()]+$/;
  return phoneRegex.test(phone);
}

// Default values for new tenants
export const DEFAULT_TENANT_INFO: TenantInfoInsert = {
  tenant_id: '', // Will be set when creating
  description: null,
  address: null,
  phone: null,
  email: null,
  operating_hours: null,
  logo_url: null,
  website: null,
  category: null,
  currency: 'IDR',
  language: 'id',
  instagram_url: null,
  tiktok_url: null,
  twitter_url: null,
  facebook_url: null,
  show_operating_hours: true,
  show_address: true,
  show_phone: true,
  show_social_media: true,
};
