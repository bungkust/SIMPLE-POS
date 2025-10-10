import { supabase } from './supabase';
import { Database } from './database.types';

type Tenant = Database['public']['Tables']['tenants']['Row'];

/**
 * Get tenant information from URL slug
 * This function handles both authenticated and public access
 */
export async function getTenantFromSlug(tenantSlug: string) {
  try {
    console.log('🔍 getTenantFromSlug: Fetching tenant from database:', tenantSlug);
    
    // Try to get tenant info from database
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('slug', tenantSlug)
      .single() as { data: Tenant | null; error: any };

    if (error || !tenant) {
      console.warn(`❌ getTenantFromSlug: Could not find tenant with slug: ${tenantSlug}`, error);
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
        pathParts[0] !== 'auth') {
      tenantSlug = pathParts[0];
      console.log('✅ getTenantInfo: Extracted tenant slug from URL:', tenantSlug);
    } else {
      tenantSlug = 'kopipendekar'; // Default fallback
      console.log('⚠️ getTenantInfo: Using default fallback tenant:', tenantSlug);
    }
  }

  // Try to get tenant from database
  const tenantInfo = await getTenantFromSlug(tenantSlug);
  
  if (tenantInfo) {
    console.log('✅ getTenantInfo: Returning tenant info from database:', tenantInfo);
    return tenantInfo;
  }

  // Fallback: return basic info without tenant_id
  const fallbackInfo = {
    tenant_slug: tenantSlug,
    tenant_id: null,
    tenant_name: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1).replace('-', ' '),
    role: 'public' as const
  };
  
  console.log('⚠️ getTenantInfo: Using fallback tenant info:', fallbackInfo);
  return fallbackInfo;
}

/**
 * Get tenant ID with fallback for public access
 * This function ensures we always have a valid tenant_id for database queries
 */
export async function getTenantId(tenantSlug?: string): Promise<string | null> {
  const tenantInfo = await getTenantInfo(tenantSlug);
  return tenantInfo.tenant_id;
}
