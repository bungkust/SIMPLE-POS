/**
 * React Query client configuration
 * Provides robust caching and data synchronization
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // Tenant queries
  tenants: ['tenants'] as const,
  tenant: (slug: string) => ['tenants', slug] as const,
  tenantInfo: (tenantId: string) => ['tenantInfo', tenantId] as const,
  
  // Menu queries
  menuItems: (tenantId: string) => ['menuItems', tenantId] as const,
  menuItemsByCategory: (tenantId: string, categoryId: string) => 
    ['menuItems', tenantId, 'category', categoryId] as const,
  menuItemsSearch: (tenantId: string, query: string) => 
    ['menuItems', tenantId, 'search', query] as const,
  
  // Category queries
  categories: (tenantId: string) => ['categories', tenantId] as const,
  
  // Order queries
  orders: (tenantId: string) => ['orders', tenantId] as const,
  order: (orderId: string) => ['orders', orderId] as const,
  
  // User queries
  userProfile: (userId: string) => ['userProfile', userId] as const,
} as const;
