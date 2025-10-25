/**
 * React Query hooks for menu items
 * Provides caching and synchronization for menu data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import { Database } from '@/lib/database.types';
import { sanitizeSearchQuery } from '@/lib/dompurify-utils';
import { optimizedQueries, queryPerformance } from '@/lib/query-optimization';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

// Fetch menu items for a tenant with pagination
export function useMenuItems(tenantId: string, options?: {
  categoryId?: string;
  searchQuery?: string;
  enabled?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: options?.categoryId 
      ? queryKeys.menuItemsByCategory(tenantId, options.categoryId)
      : options?.searchQuery
      ? queryKeys.menuItemsSearch(tenantId, options.searchQuery)
      : queryKeys.menuItems(tenantId),
    queryFn: async () => {
      return queryPerformance.trackQuery('useMenuItems', async () => {
        const sanitizedQuery = options?.searchQuery ? sanitizeSearchQuery(options.searchQuery) : undefined;
        
        let query = supabase
          .from('menu_items')
          .select('*', { count: 'exact' })
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        // Apply category filter
        if (options?.categoryId) {
          query = query.eq('category_id', options.categoryId);
        }

        // Apply search filter
        if (sanitizedQuery?.trim()) {
          query = query.or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
        }

        const { data, error, count } = await query;
        
        if (error) {
          throw new Error(`Failed to fetch menu items: ${error.message}`);
        }

        return {
          items: data as MenuItem[],
          totalCount: count || 0,
          page,
          limit,
          hasMore: (count || 0) > offset + limit
        };
      });
    },
    enabled: !!tenantId && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch all menu items for a tenant (for admin/backward compatibility)
export function useAllMenuItems(tenantId: string, options?: {
  categoryId?: string;
  searchQuery?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: options?.categoryId 
      ? queryKeys.menuItemsByCategory(tenantId, options.categoryId)
      : options?.searchQuery
      ? queryKeys.menuItemsSearch(tenantId, options.searchQuery)
      : queryKeys.menuItems(tenantId),
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply category filter
      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      // Apply search filter
      if (options?.searchQuery) {
        const sanitizedQuery = sanitizeSearchQuery(options.searchQuery);
        if (sanitizedQuery.trim()) {
          query = query.or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
        }
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch menu items: ${error.message}`);
      }

      return data as MenuItem[];
    },
    enabled: !!tenantId && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch categories for a tenant with pagination
export function useCategories(tenantId: string, options?: {
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 50; // Default 50 categories per page
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: queryKeys.categories(tenantId, page, limit),
    queryFn: async () => {
      return queryPerformance.trackQuery('useCategories', async () => {
        console.log('🔍 useCategories: Fetching categories for tenant:', tenantId, 'page:', page);
        
        const { data, error, count } = await supabase
          .from('categories')
          .select('*', { count: 'exact' })
          .eq('tenant_id', tenantId)
          .order('sort_order', { ascending: true })
          .range(offset, offset + limit - 1);

        console.log('🔍 useCategories: Query result:', { data, error, count });

        if (error) {
          console.error('❌ useCategories: Query failed:', error);
          throw new Error(`Failed to fetch categories: ${error.message}`);
        }

        console.log('✅ useCategories: Successfully fetched categories:', data);
        return {
          items: data as Category[],
          totalCount: count || 0,
          page,
          limit,
          hasMore: (count || 0) > offset + limit
        };
      });
    },
    enabled: !!tenantId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch all categories for a tenant (for backward compatibility)
export function useAllCategories(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.categories(tenantId),
    queryFn: async () => {
      return queryPerformance.trackQuery('useAllCategories', async () => {
        console.log('🔍 useAllCategories: Fetching all categories for tenant:', tenantId);
        
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('sort_order', { ascending: true });

        console.log('🔍 useAllCategories: Query result:', { data, error });

        if (error) {
          console.error('❌ useAllCategories: Query failed:', error);
          throw new Error(`Failed to fetch categories: ${error.message}`);
        }

        console.log('✅ useAllCategories: Successfully fetched categories:', data);
        return data as Category[];
      });
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single menu item
export function useMenuItem(tenantId: string, itemId: string) {
  return useQuery({
    queryKey: ['menuItem', tenantId, itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', itemId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch menu item: ${error.message}`);
      }

      return data as MenuItem;
    },
    enabled: !!tenantId && !!itemId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Create menu item mutation
export function useCreateMenuItem(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: Partial<MenuItem>) => {
      const { data, error } = await (supabase as any)
        .from('menu_items')
        .insert({
          ...itemData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create menu item: ${error.message}`);
      }

      return data as MenuItem;
    },
    onSuccess: () => {
      // Invalidate and refetch menu items
      queryClient.invalidateQueries({ queryKey: queryKeys.menuItems(tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories(tenantId) });
    },
  });
}

// Update menu item mutation
export function useUpdateMenuItem(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...itemData }: Partial<MenuItem> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('menu_items')
        .update(itemData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update menu item: ${error.message}`);
      }

      return data as MenuItem;
    },
    onSuccess: (data) => {
      // Invalidate and refetch menu items
      queryClient.invalidateQueries({ queryKey: queryKeys.menuItems(tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories(tenantId) });
      queryClient.invalidateQueries({ queryKey: ['menuItem', tenantId, data.id] });
    },
  });
}

// Delete menu item mutation
export function useDeleteMenuItem(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to delete menu item: ${error.message}`);
      }

      return itemId;
    },
    onSuccess: (itemId) => {
      // Invalidate and refetch menu items
      queryClient.invalidateQueries({ queryKey: queryKeys.menuItems(tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories(tenantId) });
      queryClient.removeQueries({ queryKey: ['menuItem', tenantId, itemId] });
    },
  });
}
