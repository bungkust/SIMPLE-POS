import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Security utilities for tenant validation and input sanitization
 */

/**
 * Validate tenant access on server-side
 * This function should be called before any tenant-specific operations
 */
export async function validateTenantAccess(tenantSlug: string): Promise<{
  isValid: boolean;
  tenantId?: string;
  error?: string;
}> {
  try {
    // Sanitize input
    const sanitizedSlug = sanitizeTenantSlug(tenantSlug);
    
    if (!isValidTenantSlug(sanitizedSlug)) {
      logger.warn('Invalid tenant slug format:', tenantSlug);
      return { isValid: false, error: 'Invalid tenant format' };
    }

    // Check if tenant exists and is active
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, slug, is_active')
      .eq('slug', sanitizedSlug)
      .eq('is_active', true)
      .single();

    if (error || !tenant) {
      logger.warn('Tenant not found or inactive:', sanitizedSlug, error);
      return { isValid: false, error: 'Tenant not found' };
    }

    logger.log('Tenant access validated:', tenant.slug);
    return { isValid: true, tenantId: tenant.id };
  } catch (error) {
    logger.error('Error validating tenant access:', error);
    return { isValid: false, error: 'Validation failed' };
  }
}

/**
 * Sanitize tenant slug to prevent injection attacks
 */
export function sanitizeTenantSlug(slug: string): string {
  // Only allow alphanumeric characters, hyphens, and underscores
  // Convert to lowercase and remove any invalid characters
  return slug.toLowerCase().replace(/[^a-z0-9-_]/g, '').substring(0, 50);
}

/**
 * Validate tenant slug format
 */
export function isValidTenantSlug(slug: string): boolean {
  // Must be 2-50 characters, alphanumeric with hyphens/underscores
  const regex = /^[a-z0-9][a-z0-9-_]{1,49}$/;
  return regex.test(slug);
}

/**
 * Sanitize search query to prevent injection attacks
 */
export function sanitizeSearchQuery(query: string): string {
  // Remove potentially dangerous characters and limit length
  return query
    .replace(/[<>'"&]/g, '') // Remove HTML/script injection characters
    .replace(/[^\w\s\u00C0-\u017F]/g, '') // Keep only alphanumeric, spaces, and accented characters
    .substring(0, 100) // Limit length
    .trim();
}

/**
 * Validate cache data structure
 */
export function validateCacheData(data: any, expectedType: 'categories' | 'menuItems'): boolean {
  if (!Array.isArray(data)) return false;
  
  if (expectedType === 'categories') {
    return data.every(item => 
      item && 
      typeof item.id === 'string' && 
      typeof item.name === 'string' &&
      typeof item.tenant_id === 'string'
    );
  } else if (expectedType === 'menuItems') {
    return data.every(item => 
      item && 
      typeof item.id === 'string' && 
      typeof item.name === 'string' &&
      typeof item.tenant_id === 'string'
    );
  }
  
  return false;
}

/**
 * Rate limiting helper (client-side)
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
}

/**
 * Create a secure cache key
 */
export function createSecureCacheKey(tenantId: string, dataType: string): string {
  // Sanitize tenant ID to prevent cache poisoning
  const sanitizedTenantId = tenantId.replace(/[^a-zA-Z0-9-_]/g, '');
  return `secure_${dataType}_${sanitizedTenantId}`;
}

/**
 * Create a safe WhatsApp URL to prevent XSS
 */
export function createSafeWhatsAppUrl(phone: string, message: string): string {
  // Sanitize phone number (remove non-numeric characters except +)
  const sanitizedPhone = phone.replace(/[^\d+]/g, '');
  
  // Sanitize message (encode special characters)
  const sanitizedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${sanitizedPhone}?text=${sanitizedMessage}`;
}