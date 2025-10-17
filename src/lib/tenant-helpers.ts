import { supabase } from './supabase';
import { logger } from './logger';
import { TenantWithInfo, TenantInfoInsert, TenantInfoUpdate, DEFAULT_TENANT_INFO } from './tenant-types';

/**
 * Fetch tenant with related tenant_info using LEFT JOIN
 */
export async function getTenantWithInfo(tenantId: string): Promise<{ data: TenantWithInfo | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        tenant_info(*)
      `)
      .eq('id', tenantId)
      .single();

    if (error) {
      logger.error('Error fetching tenant with info:', error);
      return { data: null, error };
    }

    return { data: data as TenantWithInfo, error: null };
  } catch (error) {
    logger.error('Unexpected error fetching tenant with info:', error);
    return { data: null, error };
  }
}

/**
 * Fetch tenant with info by slug (for public pages)
 */
export async function getTenantWithInfoBySlug(tenantSlug: string): Promise<{ data: TenantWithInfo | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        tenant_info(*)
      `)
      .eq('slug', tenantSlug)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error('Error fetching tenant with info by slug:', error);
      return { data: null, error };
    }

    return { data: data as TenantWithInfo, error: null };
  } catch (error) {
    logger.error('Unexpected error fetching tenant with info by slug:', error);
    return { data: null, error };
  }
}

/**
 * Create tenant_info record with default values
 */
export async function createTenantInfo(tenantId: string, data: Partial<TenantInfoInsert> = {}): Promise<{ data: any; error: any }> {
  try {
    const tenantInfoData: TenantInfoInsert = {
      ...DEFAULT_TENANT_INFO,
      tenant_id: tenantId,
      ...data,
    };

    const { data: result, error } = await supabase
      .from('tenant_info')
      .insert(tenantInfoData)
      .select()
      .single();

    if (error) {
      logger.error('Error creating tenant info:', error);
      return { data: null, error };
    }

    logger.log('✅ Tenant info created successfully:', result);
    return { data: result, error: null };
  } catch (error) {
    logger.error('Unexpected error creating tenant info:', error);
    return { data: null, error };
  }
}

/**
 * Update tenant_info using UPSERT (handles both insert and update)
 */
export async function updateTenantInfo(tenantId: string, data: Partial<TenantInfoUpdate>): Promise<{ data: any; error: any }> {
  try {
    const updateData: TenantInfoUpdate = {
      tenant_id: tenantId,
      ...data,
    };

    const { data: result, error } = await supabase
      .from('tenant_info')
      .upsert(updateData, {
        onConflict: 'tenant_id'
      })
      .select()
      .single();

    if (error) {
      logger.error('Error updating tenant info:', error);
      return { data: null, error };
    }

    logger.log('✅ Tenant info updated successfully:', result);
    return { data: result, error: null };
  } catch (error) {
    logger.error('Unexpected error updating tenant info:', error);
    return { data: null, error };
  }
}

/**
 * Get public store information by slug (for public menu pages)
 */
export async function getTenantStoreInfo(tenantSlug: string): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        slug,
        is_active,
        tenant_info!inner(
          description,
          address,
          phone,
          email,
          operating_hours,
          logo_url,
          website,
          category,
          currency,
          language,
          instagram_url,
          tiktok_url,
          twitter_url,
          facebook_url,
          show_operating_hours,
          show_address,
          show_phone,
          show_social_media
        )
      `)
      .eq('slug', tenantSlug)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error('Error fetching tenant store info:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    logger.error('Unexpected error fetching tenant store info:', error);
    return { data: null, error };
  }
}

/**
 * Delete tenant and all related data (CASCADE will handle tenant_info)
 */
export async function deleteTenantAndInfo(tenantId: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (error) {
      logger.error('Error deleting tenant:', error);
      return { error };
    }

    logger.log('✅ Tenant and related data deleted successfully');
    return { error: null };
  } catch (error) {
    logger.error('Unexpected error deleting tenant:', error);
    return { error };
  }
}

/**
 * Check if tenant_info exists for a tenant
 */
export async function tenantInfoExists(tenantId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('tenant_info')
      .select('tenant_id')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error checking tenant info existence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error('Unexpected error checking tenant info existence:', error);
    return false;
  }
}

/**
 * Get all tenants with their info (for super admin)
 */
export async function getAllTenantsWithInfo(): Promise<{ data: TenantWithInfo[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        tenant_info(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching all tenants with info:', error);
      return { data: null, error };
    }

    return { data: data as TenantWithInfo[], error: null };
  } catch (error) {
    logger.error('Unexpected error fetching all tenants with info:', error);
    return { data: null, error };
  }
}

/**
 * Batch update multiple tenant info records
 */
export async function batchUpdateTenantInfo(updates: Array<{ tenantId: string; data: Partial<TenantInfoUpdate> }>): Promise<{ data: any; error: any }> {
  try {
    const updateData = updates.map(({ tenantId, data }) => ({
      tenant_id: tenantId,
      ...data,
    }));

    const { data: result, error } = await supabase
      .from('tenant_info')
      .upsert(updateData, {
        onConflict: 'tenant_id'
      })
      .select();

    if (error) {
      logger.error('Error batch updating tenant info:', error);
      return { data: null, error };
    }

    logger.log('✅ Batch tenant info update successful:', result);
    return { data: result, error: null };
  } catch (error) {
    logger.error('Unexpected error batch updating tenant info:', error);
    return { data: null, error };
  }
}
