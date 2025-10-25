/**
 * Infinite scroll hook for categories
 * Provides pagination with infinite scroll functionality
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import { queryPerformance } from '@/lib/query-optimization';
import { Database } from '@/lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

export function useCategoriesInfinite(tenantId: string, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: queryKeys.categories(tenantId),
    queryFn: async ({ pageParam = 0 }) => {
      return queryPerformance.trackQuery('useCategoriesInfinite', async () => {
        const offset = pageParam * limit;
        
        console.log('🔍 useCategoriesInfinite: Fetching categories page:', pageParam, 'offset:', offset);
        
        const { data, error, count } = await supabase
          .from('categories')
          .select('*', { count: 'exact' })
          .eq('tenant_id', tenantId)
          .order('sort_order', { ascending: true })
          .range(offset, offset + limit - 1);

        console.log('🔍 useCategoriesInfinite: Query result:', { data, error, count });

        if (error) {
          console.error('❌ useCategoriesInfinite: Query failed:', error);
          throw new Error(`Failed to fetch categories: ${error.message}`);
        }

        console.log('✅ useCategoriesInfinite: Successfully fetched categories:', data);
        
        return {
          items: data as Category[],
          totalCount: count || 0,
          hasMore: (count || 0) > offset + limit,
          nextPage: pageParam + 1
        };
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook untuk mendapatkan semua categories yang sudah di-fetch
export function useAllFetchedCategories(tenantId: string, limit: number = 20) {
  const infiniteQuery = useCategoriesInfinite(tenantId, limit);
  
  const allCategories = infiniteQuery.data?.pages.flatMap(page => page.items) || [];
  const totalCount = infiniteQuery.data?.pages[0]?.totalCount || 0;
  const hasMore = infiniteQuery.data?.pages[infiniteQuery.data.pages.length - 1]?.hasMore || false;
  
  return {
    ...infiniteQuery,
    allCategories,
    totalCount,
    hasMore,
    loadMore: infiniteQuery.fetchNextPage
  };
}
