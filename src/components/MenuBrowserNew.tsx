import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Package,
  Loader2,
  Plus,
  Minus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getTenantInfo } from '../lib/tenantUtils';
import { MenuDetailSheet } from './MenuDetailSheet';
import { Database } from '../lib/database.types';
import { colors, typography, components, sizes, shadows, cn } from '@/lib/design-system';
import { 
  sanitizeSearchQuery, 
  validateCacheData, 
  createSecureCacheKey,
  RateLimiter 
} from '../lib/security-utils';
import { useMenuItems, useAllCategories } from '../hooks/use-menu-queries';
import { getThumbnailUrl, getMediumImageUrl, getResponsiveImageSize, getResponsiveImageSizeForDisplay } from '../lib/image-utils';
import { useImagePreloader } from '../hooks/use-image-preloader';
// import { ThumbnailImage, MediumImage } from '@/components/ui/lazy-image';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  is_available?: boolean;
};
type Category = Database['public']['Tables']['categories']['Row'];

// Optimized MenuItem component
const MenuItemCard = memo(function MenuItemCard({ 
  item, 
  index, 
  onItemClick, 
  onAddToCart, 
  onRemoveFromCart, 
  getItemQuantity,
  isMobile = false 
}: {
  item: MenuItem;
  index: number;
  onItemClick: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (item: MenuItem) => void;
  getItemQuantity: (itemId: string) => number;
  isMobile?: boolean;
}) {
  const discount = useMemo(() => 
    item.base_price && item.base_price > item.price ? item.base_price - item.price : 0,
    [item.base_price, item.price]
  );

  const quantity = useMemo(() => getItemQuantity(item.id), [getItemQuantity, item.id]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(item);
  }, [onAddToCart, item]);

  const handleRemoveFromCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveFromCart(item);
  }, [onRemoveFromCart, item]);

  const handleItemClick = useCallback(() => {
    onItemClick(item);
  }, [onItemClick, item]);

  if (isMobile) {
    return (
      <div 
        className={cn(components.card, components.cardHover, "cursor-pointer")}
        onClick={handleItemClick}
      >
        <div className={cn(sizes.card.md)}>
          <div className="flex items-start gap-5">
            {/* Food Image */}
            <div className="flex-shrink-0">
              {item.photo_url ? (
                <img
                  src={getMediumImageUrl(item.photo_url, getResponsiveImageSizeForDisplay(96, 96))}
                  alt={item.name}
                  className={cn("w-24 h-24 rounded-xl object-cover", shadows.sm)}
                  loading={index < 6 ? "eager" : "lazy"}
                  fetchpriority={index < 3 ? "high" : "auto"}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.png';
                  }}
                />
              ) : (
                <div className={cn("w-24 h-24 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center", shadows.sm)}>
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Food Info */}
            <div className="flex-1 min-w-0">
              <div className="flex-1">
                <h3 className={cn(typography.h4, "mb-3 leading-tight")}>
                  {item.name}
                </h3>
                <p className={cn(typography.body.small, colors.text.muted, "mb-3 line-clamp-2")}>
                  {item.description}
                </p>
                
                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {discount > 0 && (
                      <span className={cn(typography.body.small, "text-gray-500 line-through")}>
                        Rp {item.base_price?.toLocaleString()}
                      </span>
                    )}
                    <span className={cn(typography.h4, colors.text.primary, "font-semibold")}>
                      Rp {item.price.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    {quantity > 0 ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRemoveFromCart}
                          className={cn(components.button.sm, "rounded-full")}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className={cn(typography.body.small, "font-medium min-w-[20px] text-center")}>
                          {quantity}
                        </span>
                        <button
                          onClick={handleAddToCart}
                          className={cn(components.button.sm, "rounded-full")}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAddToCart}
                        className={cn(components.button.sm, "rounded-full")}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <Card 
      className={cn(components.card, components.cardHover, "cursor-pointer")}
      onClick={handleItemClick}
    >
      <div className={cn(sizes.card.lg)}>
        {/* Food Image */}
        <div className="relative mb-4">
          {item.photo_url ? (
            <img
              src={getMediumImageUrl(item.photo_url, getResponsiveImageSizeForDisplay(200, 200))}
              alt={item.name}
              className={cn("w-full h-48 rounded-lg object-cover", shadows.sm)}
              loading={index < 6 ? "eager" : "lazy"}
              fetchpriority={index < 3 ? "high" : "auto"}
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png';
              }}
            />
          ) : (
            <div className={cn("w-full h-48 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center", shadows.sm)}>
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
              Diskon
            </div>
          )}
        </div>

        {/* Food Info */}
        <div className="space-y-3">
          <h3 className={cn(typography.h4, "leading-tight")}>
            {item.name}
          </h3>
          <p className={cn(typography.body.small, colors.text.muted, "line-clamp-2")}>
            {item.description}
          </p>
          
          {/* Price and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {discount > 0 && (
                <span className={cn(typography.body.small, "text-gray-500 line-through")}>
                  Rp {item.base_price?.toLocaleString()}
                </span>
              )}
              <span className={cn(typography.h4, colors.text.primary, "font-semibold")}>
                Rp {item.price.toLocaleString()}
              </span>
            </div>
            
            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              {quantity > 0 ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRemoveFromCart}
                    className={cn(components.button.sm, "rounded-full")}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className={cn(typography.body.small, "font-medium min-w-[20px] text-center")}>
                    {quantity}
                  </span>
                  <button
                    onClick={handleAddToCart}
                    className={cn(components.button.sm, "rounded-full")}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className={cn(components.button.sm, "rounded-full")}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

export const MenuBrowser = memo(function MenuBrowser() {
  const { addItem, removeItem, updateQuantity, getItemQuantity } = useCart();
  
  // Wrapper function to convert MenuItem to CartItem
  const handleAddToCart = useCallback((item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price || 0,
      qty: 1,
      photo_url: item.photo_url,
      notes: '' // Default empty notes
    });
  }, [addItem]);
  
  // Wrapper function to decrease quantity or remove item
  const handleRemoveFromCart = useCallback((item: MenuItem) => {
    const currentQuantity = getItemQuantity(item.id);
    if (currentQuantity > 1) {
      // Decrease quantity by 1
      updateQuantity(item.id, currentQuantity - 1);
    } else {
      // Remove item completely if quantity is 1
      removeItem(item.id);
    }
  }, [removeItem, updateQuantity, getItemQuantity]);
  
  // Get auth context safely
  let currentTenant = null;
  try {
    const authContext = useAuth();
    currentTenant = authContext?.currentTenant || null;
  } catch (error) {
    // AuthContext not available, will use URL fallback
    console.log('AuthContext not available, using URL fallback');
  }
  const { preloadCriticalImages } = useImagePreloader();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // Use React Query hooks for data fetching
  const tenantId = currentTenant?.id || '';
  console.log('🔍 MenuBrowser: Using tenant ID for queries:', tenantId);
  
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useAllCategories(tenantId);
  const { 
    data: menuData, 
    isLoading: menuLoading, 
    error: menuError 
  } = useMenuItems(tenantId, {
    categoryId: selectedCategory || undefined,
    searchQuery: debouncedSearchQuery || undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    enabled: !!tenantId
  });
  
  // Debug logging
  console.log('🔍 MenuBrowser: Categories data:', categories);
  console.log('🔍 MenuBrowser: Categories loading:', categoriesLoading);
  console.log('🔍 MenuBrowser: Categories error:', categoriesError);
  
  const menuItems = menuData?.items || [];
  const totalItems = menuData?.totalCount || 0;
  const hasMore = menuData?.hasMore || false;
  const loading = categoriesLoading || menuLoading;
  
  // Rate limiter for API calls - increased limit
  const rateLimiter = useMemo(() => new RateLimiter(30, 60000), []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cache key for localStorage with validation
  const getCacheKey = useCallback((tenantId: string, dataType: 'categories' | 'menuItems') => {
    return createSecureCacheKey(tenantId, `menuBrowser_${dataType}`);
  }, []);

  // Check if cache is valid (5 minutes TTL)
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < 5 * 60 * 1000; // 5 minutes
  }, []);

  // Load more items (pagination)
  const loadMoreItems = useCallback(() => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, loading]);


  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, debouncedSearchQuery]);

  // Load tenant info
  useEffect(() => {
    const loadTenantInfo = async () => {
      try {
        let resolvedTenantInfo: any = null;
        if (currentTenant) {
          resolvedTenantInfo = {
            tenant_id: (currentTenant as any).id,
            tenant_slug: (currentTenant as any).slug,
            tenant_name: (currentTenant as any).name,
            phone: (currentTenant as any).phone ?? null,
            address: (currentTenant as any).address ?? null,
          };
        }
        
        if (!resolvedTenantInfo) {
          resolvedTenantInfo = await getTenantInfo();
        }
        
        if (!resolvedTenantInfo) {
          console.error('No tenant info available - redirecting to landing page');
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          return;
        }
        
        setTenantInfo(resolvedTenantInfo);
        console.log('MenuBrowser: Got tenant info:', resolvedTenantInfo);
      } catch (error) {
        console.error('Error loading tenant info:', error);
      }
    };

    loadTenantInfo();
  }, [currentTenant]);

  // Preload critical images when menu items are loaded
  useEffect(() => {
    if (menuItems.length > 0) {
      const criticalImageUrls = menuItems
        .slice(0, 6) // First 6 images
        .map(item => item.photo_url)
        .filter(Boolean) as string[];
      
      if (criticalImageUrls.length > 0) {
        preloadCriticalImages(criticalImageUrls);
      }
    }
  }, [menuItems, preloadCriticalImages]);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreButton = document.getElementById('load-more-trigger');
    if (loadMoreButton) {
      observer.observe(loadMoreButton);
    }

    return () => {
      if (loadMoreButton) {
        observer.unobserve(loadMoreButton);
      }
    };
  }, [hasMore, loading, loadMoreItems]);

  // Filter menu items (now handled by server-side filtering)
  const filteredItems = useMemo(() => {
    // Since filtering is now done server-side, we just return the current menu items
    return menuItems;
  }, [menuItems]);

  // Debug logging (reduced for performance)
  if (import.meta.env.DEV && menuItems.length > 0) {
    console.log('MenuBrowser: Loaded', menuItems.length, 'items,', categories?.length || 0, 'categories');
  }

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDetailSheetOpen(true);
  };

  if (loading || !tenantInfo) {
    return (
      <div className="container mx-auto p-4 pt-20 max-w-4xl">
        <div className="mb-6">
          <h1 className={cn(typography.h2, "mb-4 text-center")}>Our Menu</h1>
          
          {/* Search and Category Filter Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <div className="loading-skeleton h-10 rounded-lg"></div>
            </div>
            <div className="w-full sm:w-auto">
              <div className="loading-skeleton h-10 rounded-lg"></div>
            </div>
          </div>

          {/* Menu Items Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="card overflow-hidden">
                <div className="loading-skeleton h-48 w-full"></div>
                <div className="p-4">
                  <div className="loading-skeleton h-6 w-3/4 mb-2"></div>
                  <div className="loading-skeleton h-4 w-full mb-2"></div>
                  <div className="loading-skeleton h-4 w-2/3 mb-4"></div>
                  <div className="flex items-center justify-between">
                    <div className="loading-skeleton h-6 w-16"></div>
                    <div className="loading-skeleton h-8 w-8 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto p-4 pb-40">
        {/* Navigation Tabs - Dynamic from Database */}
        <div className="mb-6 relative">
          <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto scrollbar-hide pb-3 px-4 scroll-smooth">
            <button 
              className={`font-medium border-b-2 whitespace-nowrap text-sm sm:text-base px-3 py-2 transition-all duration-200 ${
                selectedCategory === '' 
                  ? 'text-blue-600 border-blue-600 font-semibold' 
                  : 'text-gray-600 hover:text-gray-900 border-transparent font-medium hover:border-gray-300'
              }`}
              onClick={() => setSelectedCategory('')}
            >
              Semua Menu
            </button>
            {categories?.map((category) => (
              <button 
                key={category.id}
                className={`font-medium border-b-2 whitespace-nowrap text-sm sm:text-base px-3 py-2 transition-all duration-200 ${
                  selectedCategory === category.id 
                    ? 'text-blue-600 border-blue-600 font-semibold' 
                    : 'text-gray-600 hover:text-gray-900 border-transparent font-medium hover:border-gray-300'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name.toUpperCase()}
              </button>
            ))}
          </div>
          {/* Fade effects */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
        </div>


        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Cari menu favoritmu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm bg-white"
            />
            {searchQuery !== debouncedSearchQuery && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>


        {/* Menu Items - Food Delivery Style */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className={cn(typography.h3, "mb-2")}>Tidak ada menu ditemukan</h3>
            <p className={cn(typography.body.small, colors.text.muted, "max-w-sm mx-auto")}>
              {searchQuery 
                ? `Tidak ada menu yang cocok dengan "${searchQuery}"`
                : 'Belum ada menu tersedia'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section Title */}
            <h2 className={cn(typography.h2, "mb-2")}>
              {selectedCategory === '' 
                ? 'Semua Menu' 
                : categories?.find(c => c.id === selectedCategory)?.name || 'Menu'
              }
            </h2>
            
            {/* Menu Items - Mobile Layout */}
            <div className="space-y-2 md:hidden">
              {/* Mobile: List Layout */}
              {filteredItems.map((item, index) => (
                <MenuItemCard
                    key={item.id} 
                  item={item}
                  index={index}
                  onItemClick={handleItemClick}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  getItemQuantity={getItemQuantity}
                  isMobile={true}
                />
              ))}
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
              {filteredItems.map((item, index) => (
                <MenuItemCard
                    key={item.id} 
                  item={item}
                  index={index}
                  onItemClick={handleItemClick}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  getItemQuantity={getItemQuantity}
                  isMobile={false}
                />
              ))}
                    </div>
                            </div>
                          )}
                          
        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button 
              id="load-more-trigger"
              onClick={loadMoreItems}
              disabled={loading}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-colors",
                "bg-primary hover:bg-primary/90 text-primary-foreground",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center gap-2"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  Load More Items
                </>
              )}
            </button>
          </div>
        )}

        {/* Pagination Info */}
        {totalItems > 0 && (
          <div className="text-center mt-4">
            <p className={cn(typography.body.small, colors.text.muted)}>
              Showing {menuItems.length} of {totalItems} items
            </p>
          </div>
        )}
      </div>

      {/* Menu Detail Sheet */}
      <MenuDetailSheet
        item={selectedItem ? {
          id: selectedItem.id,
          name: selectedItem.name,
          description: selectedItem.description || undefined,
          price: selectedItem.price || 0,
          base_price: selectedItem.base_price || undefined,
          photo_url: selectedItem.photo_url || undefined,
          category_id: selectedItem.category_id || undefined,
          is_available: selectedItem.is_available || true,
          preparation_time: (selectedItem as any).preparation_time || undefined,
          tenant_id: selectedItem.tenant_id
        } : null}
        isOpen={isDetailSheetOpen}
        onClose={() => {
          setIsDetailSheetOpen(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
});
