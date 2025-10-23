import { supabase } from './supabase';
import { Database } from './database.types';

type Tenant = Database['public']['Tables']['tenants']['Row'];

// Cache for tenant data to prevent repeated database calls
const tenantCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for optimal performance

// Helper function to get cached data or fetch new data
const getCachedOrFetch = async <T>(
  key: string, 
  fetchFn: () => Promise<T>
): Promise<T> => {
  const cached = tenantCache.get(key);
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('📦 Using cached tenant data for:', key);
    return cached.data;
  }
  
  // Fetch new data
  console.log('🔄 Fetching fresh tenant data for:', key);
  const data = await fetchFn();
  
  // Cache the result
  tenantCache.set(key, { data, timestamp: now });
  
  return data;
};

/**
 * Sanitize tenant slug to prevent injection attacks
 */
function sanitizeTenantSlug(slug: string): string {
  // Only allow alphanumeric characters, hyphens, and underscores
  // Convert to lowercase and remove any invalid characters
  return slug.toLowerCase().replace(/[^a-z0-9-_]/g, '').substring(0, 50);
}

/**
 * Validate tenant slug format
 */
function isValidTenantSlug(slug: string): boolean {
  // Must be 2-50 characters, alphanumeric with hyphens/underscores
  const regex = /^[a-z0-9][a-z0-9-_]{1,49}$/;
  return regex.test(slug);
}

/**
 * Get tenant information from URL slug
 * This function handles both authenticated and public access
 */
export async function getTenantFromSlug(tenantSlug: string) {
  // Sanitize and validate input
  const sanitizedSlug = sanitizeTenantSlug(tenantSlug);
  
  if (!isValidTenantSlug(sanitizedSlug)) {
    console.warn('❌ getTenantFromSlug: Invalid tenant slug format:', tenantSlug);
    return null;
  }
  
  const cacheKey = `tenant-${sanitizedSlug}`;
  
  return getCachedOrFetch(cacheKey, async () => {
    try {
      console.log('🔍 getTenantFromSlug: Fetching tenant from database:', sanitizedSlug);
      
      // Try to get tenant info from database
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('slug', sanitizedSlug)
        .single() as { data: Tenant | null; error: any };

      if (error || !tenant) {
        console.warn(`❌ getTenantFromSlug: Could not find tenant with slug: ${sanitizedSlug}`, error);
        return null;
      }

      console.log('✅ getTenantFromSlug: Found tenant in database:', tenant);

      return {
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        tenant_name: tenant.name,
        role: 'public' as const
      };
    } catch (error) {
      console.error('❌ getTenantFromSlug: Error fetching tenant from slug:', error);
      return null;
    }
  });
}

/**
 * Get tenant info with fallback for public access
 * This function tries to get tenant from database, but provides fallback for public pages
 */
export async function getTenantInfo(tenantSlug?: string) {
  // If no tenant slug provided, try to get from URL
  if (!tenantSlug) {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(Boolean);
    
    console.log('🔍 getTenantInfo: URL path analysis:', {
      fullPath: path,
      pathParts: pathParts,
      firstPart: pathParts[0],
      conditions: {
        hasFirstPart: pathParts.length >= 1,
        notAdmin: !pathParts[0]?.includes('admin'),
        notLogin: !pathParts[0]?.includes('login'),
        notCheckout: pathParts[0] !== 'checkout',
        notOrders: pathParts[0] !== 'orders',
        notInvoice: pathParts[0] !== 'invoice',
        notSuccess: pathParts[0] !== 'success',
        notAuth: pathParts[0] !== 'auth'
      }
    });
    
    if (pathParts.length >= 1 && 
        !pathParts[0].includes('admin') && 
        !pathParts[0].includes('login') && 
        pathParts[0] !== 'checkout' && 
        pathParts[0] !== 'orders' && 
        pathParts[0] !== 'invoice' && 
        pathParts[0] !== 'success' && 
        pathParts[0] !== 'auth' &&
        pathParts[0] !== 'undefined' &&
        pathParts[0] !== 'null') {
      
      // Sanitize the extracted slug
      const extractedSlug = sanitizeTenantSlug(pathParts[0]);
      if (isValidTenantSlug(extractedSlug)) {
        tenantSlug = extractedSlug;
        console.log('✅ getTenantInfo: Extracted and validated tenant slug from URL:', tenantSlug);
      } else {
        console.warn('❌ getTenantInfo: Invalid tenant slug from URL, rejecting:', pathParts[0]);
        return null; // Reject invalid slugs instead of using fallback
      }
    } else {
      console.warn('❌ getTenantInfo: No valid tenant slug found in URL');
      return null; // Reject instead of using fallback
    }
  }

  const cacheKey = `tenant-info-${tenantSlug}`;
  
  return getCachedOrFetch(cacheKey, async () => {
    // Try to get tenant from database
    const tenantInfo = await getTenantFromSlug(tenantSlug);
    
    if (tenantInfo) {
      console.log('✅ getTenantInfo: Returning tenant info from database:', tenantInfo);
      return tenantInfo;
    }

    // No fallback - return null if tenant not found
    console.warn('❌ getTenantInfo: Tenant not found in database:', tenantSlug);
    
    // Redirect to landing page if tenant doesn't exist
    if (typeof window !== 'undefined') {
      console.log('🔄 Redirecting to landing page - tenant not found');
      window.location.href = '/';
    }
    
    return null;
  });
}

/**
 * Get tenant ID with fallback for public access
 * This function ensures we always have a valid tenant_id for database queries
 */
export async function getTenantId(tenantSlug?: string): Promise<string | null> {
  const tenantInfo = await getTenantInfo(tenantSlug);
  return tenantInfo.tenant_id;
}

/**
 * Clear tenant cache - useful for testing or when tenant data changes
 */
export function clearTenantCache(): void {
  tenantCache.clear();
  console.log('🗑️ Tenant cache cleared');
}

/**
 * Get cache statistics for debugging
 */
export function getTenantCacheStats(): { size: number; keys: string[] } {
  return {
    size: tenantCache.size,
    keys: Array.from(tenantCache.keys())
  };
}
