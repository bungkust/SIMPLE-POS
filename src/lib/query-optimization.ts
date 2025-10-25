/**
 * Database Query Optimization Utilities
 * Provides optimized query patterns and caching strategies
 */

import { supabase } from './supabase';
import { logger } from './logger';

// Query optimization settings
export const QUERY_OPTIMIZATION = {
  // Batch size for bulk operations
  BATCH_SIZE: 100,
  
  // Cache TTL in milliseconds
  CACHE_TTL: {
    SHORT: 30 * 1000,    // 30 seconds
    MEDIUM: 2 * 60 * 1000, // 2 minutes
    LONG: 5 * 60 * 1000,   // 5 minutes
    VERY_LONG: 10 * 60 * 1000 // 10 minutes
  },
  
  // Retry settings
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second
    BACKOFF_MULTIPLIER: 2
  }
} as const;

// Optimized query builder with built-in caching and error handling
export class OptimizedQueryBuilder {
  private query: any;
  private cacheKey?: string;
  private cacheTTL: number = QUERY_OPTIMIZATION.CACHE_TTL.MEDIUM;

  constructor(table: string) {
    this.query = supabase.from(table);
  }

  // Set cache key for this query
  cache(key: string, ttl: number = QUERY_OPTIMIZATION.CACHE_TTL.MEDIUM): this {
    this.cacheKey = key;
    this.cacheTTL = ttl;
    return this;
  }

  // Add select with optimized columns
  select(columns: string = '*'): this {
    this.query = this.query.select(columns);
    return this;
  }

  // Add filters with optimized indexing
  filter(column: string, operator: string, value: any): this {
    this.query = this.query[operator](column, value);
    return this;
  }

  // Add ordering with optimized indexes
  order(column: string, ascending: boolean = true): this {
    this.query = this.query.order(column, { ascending });
    return this;
  }

  // Add pagination
  paginate(page: number, limit: number): this {
    const offset = (page - 1) * limit;
    this.query = this.query.range(offset, offset + limit - 1);
    return this;
  }

  // Execute query with retry logic and caching
  async execute(): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= QUERY_OPTIMIZATION.RETRY.MAX_ATTEMPTS; attempt++) {
      try {
        // Check cache first
        if (this.cacheKey) {
          const cached = this.getFromCache();
          if (cached) {
            logger.log(`Cache hit for key: ${this.cacheKey}`);
            return cached;
          }
        }

        // Execute query
        const { data, error } = await this.query;
        
        if (error) {
          throw new Error(`Database query failed: ${error.message}`);
        }

        // Cache result if cache key is set
        if (this.cacheKey && data) {
          this.setCache(data);
        }

        return data;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Query attempt ${attempt} failed:`, error);
        
        if (attempt < QUERY_OPTIMIZATION.RETRY.MAX_ATTEMPTS) {
          const delay = QUERY_OPTIMIZATION.RETRY.DELAY * Math.pow(QUERY_OPTIMIZATION.RETRY.BACKOFF_MULTIPLIER, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Query failed after all retry attempts');
  }

  // Simple cache implementation using localStorage
  private getFromCache(): any | null {
    if (!this.cacheKey) return null;
    
    try {
      const cached = localStorage.getItem(`query_cache_${this.cacheKey}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheTTL) {
          return data;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(`query_cache_${this.cacheKey}`);
        }
      }
    } catch (error) {
      logger.warn('Cache read error:', error);
    }
    
    return null;
  }

  private setCache(data: any): void {
    if (!this.cacheKey) return;
    
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`query_cache_${this.cacheKey}`, JSON.stringify(cacheData));
    } catch (error) {
      logger.warn('Cache write error:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Optimized query functions for common operations
export const optimizedQueries = {
  // Get menu items with optimized query
  getMenuItems: (tenantId: string, options?: {
    categoryId?: string;
    searchQuery?: string;
    page?: number;
    limit?: number;
  }) => {
    const builder = new OptimizedQueryBuilder('menu_items')
      .cache(`menu_items_${tenantId}_${options?.categoryId || 'all'}_${options?.searchQuery || ''}_${options?.page || 1}`)
      .select('*')
      .filter('tenant_id', 'eq', tenantId)
      .filter('is_active', 'eq', true)
      .order('created_at', false);

    if (options?.categoryId) {
      builder.filter('category_id', 'eq', options.categoryId);
    }

    if (options?.searchQuery) {
      // Use optimized search with proper indexing
      builder.query = builder.query.or(`name.ilike.%${options.searchQuery}%,description.ilike.%${options.searchQuery}%`);
    }

    if (options?.page && options?.limit) {
      builder.paginate(options.page, options.limit);
    }

    return builder.execute();
  },

  // Get categories with optimized query
  getCategories: (tenantId: string) => {
    return new OptimizedQueryBuilder('categories')
      .cache(`categories_${tenantId}`, QUERY_OPTIMIZATION.CACHE_TTL.LONG)
      .select('*')
      .filter('tenant_id', 'eq', tenantId)
      .filter('is_active', 'eq', true)
      .order('name', true)
      .execute();
  },

  // Get tenant info with optimized query
  getTenantInfo: (tenantSlug: string) => {
    return new OptimizedQueryBuilder('tenants')
      .cache(`tenant_${tenantSlug}`, QUERY_OPTIMIZATION.CACHE_TTL.VERY_LONG)
      .select('*')
      .filter('slug', 'eq', tenantSlug)
      .filter('is_active', 'eq', true)
      .execute();
  }
};

// Batch operations for better performance
export const batchOperations = {
  // Batch insert menu items
  insertMenuItems: async (items: any[]) => {
    const batches = [];
    for (let i = 0; i < items.length; i += QUERY_OPTIMIZATION.BATCH_SIZE) {
      batches.push(items.slice(i, i + QUERY_OPTIMIZATION.BATCH_SIZE));
    }

    const results = [];
    for (const batch of batches) {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(batch)
        .select();

      if (error) {
        throw new Error(`Batch insert failed: ${error.message}`);
      }

      results.push(...(data || []));
    }

    return results;
  },

  // Batch update menu items
  updateMenuItems: async (updates: Array<{ id: string; data: any }>) => {
    const results = [];
    
    for (const update of updates) {
      const { data, error } = await supabase
        .from('menu_items')
        .update(update.data)
        .eq('id', update.id)
        .select()
        .single();

      if (error) {
        logger.warn(`Update failed for item ${update.id}:`, error);
        continue;
      }

      results.push(data);
    }

    return results;
  }
};

// Query performance monitoring
export const queryPerformance = {
  // Track query execution time
  trackQuery: async <T>(queryName: string, queryFn: () => Promise<T>): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logger.log(`Query ${queryName} executed in ${duration.toFixed(2)}ms`);
      
      // Log slow queries
      if (duration > 1000) {
        logger.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      logger.error(`Query ${queryName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },

  // Clear all query caches
  clearCache: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('query_cache_')) {
        localStorage.removeItem(key);
      }
    });
    logger.log('Query cache cleared');
  }
};

// Export default instance
export default {
  QUERY_OPTIMIZATION,
  OptimizedQueryBuilder,
  optimizedQueries,
  batchOperations,
  queryPerformance
};
