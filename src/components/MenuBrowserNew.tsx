import { useState, useEffect, useMemo, useCallback } from 'react';
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
// import { ThumbnailImage, MediumImage } from '@/components/ui/lazy-image';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  is_available?: boolean;
};
type Category = Database['public']['Tables']['categories']['Row'];

export function MenuBrowser() {
  const { addItem, removeItem, getItemQuantity } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cache key for localStorage
  const getCacheKey = useCallback((tenantId: string, dataType: 'categories' | 'menuItems') => {
    return `menuBrowser_${dataType}_${tenantId}`;
  }, []);

  // Check if cache is valid (5 minutes TTL)
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < 5 * 60 * 1000; // 5 minutes
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get tenant info - use currentTenant if available (authenticated), otherwise use URL
        let resolvedTenantInfo;
        try {
          const { currentTenant } = useAuth();
          if (currentTenant) {
            resolvedTenantInfo = currentTenant;
          }
        } catch (error) {
          // Not authenticated, use URL-based tenant detection
        }
        
        if (!resolvedTenantInfo) {
          resolvedTenantInfo = await getTenantInfo();
        }
        
        setTenantInfo(resolvedTenantInfo);
        console.log('MenuBrowser: Got tenant info:', resolvedTenantInfo);
        const tenantId = (resolvedTenantInfo as any).tenant_id;
        console.log('MenuBrowser: Got tenant ID:', tenantId);
        
        if (!tenantId) {
          console.error('No tenant ID found for tenant:', resolvedTenantInfo);
          console.log('This might be normal for public access - will show empty menu');
          setLoading(false);
          return;
        }


        // Check cache for categories
        const categoriesCacheKey = getCacheKey(tenantId, 'categories');
        const cachedCategories = localStorage.getItem(categoriesCacheKey);
        
        if (cachedCategories) {
          try {
            const { data, timestamp } = JSON.parse(cachedCategories);
            if (isCacheValid(timestamp)) {
              console.log('MenuBrowser: Using cached categories');
              setCategories(data);
            } else {
              console.log('MenuBrowser: Categories cache expired, fetching fresh data');
            }
          } catch (error) {
            console.warn('MenuBrowser: Failed to parse cached categories:', error);
          }
        }

        // Load categories if not cached or cache expired
        if (!cachedCategories || !isCacheValid(JSON.parse(cachedCategories).timestamp)) {
        console.log('MenuBrowser: Loading categories for tenant ID:', tenantId);
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('sort_order', { ascending: true });

        if (categoriesError) {
          console.error('Error loading categories:', categoriesError);
          console.error('Categories error details:', categoriesError.message, categoriesError.details);
          console.error('Categories error code:', categoriesError.code);
        } else {
          console.log('MenuBrowser: Loaded categories:', categoriesData);
          console.log('MenuBrowser: Categories count:', categoriesData?.length || 0);
          if (categoriesData && categoriesData.length > 0) {
              console.log('MenuBrowser: Category names:', categoriesData.map((c: any) => c.name));
            }
            setCategories(categoriesData || []);
            
            // Cache categories
            localStorage.setItem(categoriesCacheKey, JSON.stringify({
              data: categoriesData || [],
              timestamp: Date.now()
            }));
          }
        }

        // Check cache for menu items
        const menuItemsCacheKey = getCacheKey(tenantId, 'menuItems');
        const cachedMenuItems = localStorage.getItem(menuItemsCacheKey);
        
        if (cachedMenuItems) {
          try {
            const { data, timestamp } = JSON.parse(cachedMenuItems);
            if (isCacheValid(timestamp)) {
              console.log('MenuBrowser: Using cached menu items');
              setMenuItems(data);
            } else {
              console.log('MenuBrowser: Menu items cache expired, fetching fresh data');
            }
          } catch (error) {
            console.warn('MenuBrowser: Failed to parse cached menu items:', error);
          }
        }

        // Load menu items if not cached or cache expired
        if (!cachedMenuItems || !isCacheValid(JSON.parse(cachedMenuItems).timestamp)) {
        console.log('MenuBrowser: Loading menu items for tenant ID:', tenantId);
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (menuError) {
          console.error('Error loading menu items:', menuError);
        } else {
          console.log('MenuBrowser: Loaded menu items:', menuData);
          setMenuItems(menuData || []);
            
            // Cache menu items
            localStorage.setItem(menuItemsCacheKey, JSON.stringify({
              data: menuData || [],
              timestamp: Date.now()
            }));
          }
        }

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getCacheKey, isCacheValid]);

  // Memoized filtered items with debounced search
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
      const matchesSearch = !debouncedSearchQuery || 
        item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });
  }, [menuItems, selectedCategory, debouncedSearchQuery]);

  // Debug logging
  console.log('MenuBrowser: Categories:', categories);
  console.log('MenuBrowser: Categories length:', categories.length);
  console.log('MenuBrowser: Menu items:', menuItems);
  console.log('MenuBrowser: Filtered items:', filteredItems);
  console.log('MenuBrowser: Selected category:', selectedCategory);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDetailSheetOpen(true);
  };

  if (loading || !tenantInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className={cn(typography.body.medium, colors.text.secondary)}>Loading menu...</p>
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
            {categories.map((category) => (
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
                : categories.find(c => c.id === selectedCategory)?.name || 'Menu'
              }
            </h2>
            
            {/* Menu Items - Mobile Layout */}
            <div className="space-y-2">
              {/* Mobile: List Layout */}
              {filteredItems.map((item) => {
                const discount = item.base_price && item.base_price > item.price 
                  ? item.base_price - item.price 
                  : 0;

                return (
                  <div 
                    key={item.id} 
                    className={cn(components.card, components.cardHover, "cursor-pointer")}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className={cn(sizes.card.md)}>
                      <div className="flex items-start gap-5">
                        {/* Food Image */}
                        <div className="flex-shrink-0">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className={cn("w-24 h-24 rounded-xl object-cover", shadows.sm)}
                              loading="lazy"
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
                            
                            {/* Description - Fixed 3 lines */}
                            <div className="h-12 mb-3 flex items-start">
                              {item.description ? (
                                <p className={cn(typography.body.small, colors.text.secondary, "line-clamp-3 leading-relaxed")}>
                                  {item.description}
                                </p>
                              ) : (
                                <p className={cn(typography.body.small, colors.text.muted, "line-clamp-3 leading-relaxed")}>
                                  No description available
                                </p>
                              )}
                            </div>
                            
                            {/* Empty row for spacing */}
                            <div className="h-4"></div>
                              
                              {/* Discount Badge */}
                              {discount > 0 && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className={cn(components.badge, "bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full")}>
                                    Diskon Rp{discount.toLocaleString('id-ID')}
                                  </span>
                                  {item.base_price && (
                                  <span className={cn(typography.body.small, colors.text.muted, "line-through")}>
                                      Rp{item.base_price.toLocaleString('id-ID')}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Current Price */}
                            <p className={cn(typography.price.large, "mb-4")}>
                              Rp{(item.price || 0).toLocaleString('id-ID')}
                            </p>

                            {/* Add Button Row */}
                            <div className="flex justify-end">
                            {/* Quantity Selector */}
                            <div className="flex-shrink-0">
                            {getItemQuantity(item.id) > 0 ? (
                              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white h-9 shadow-sm">
                                <button 
                                  className="w-9 h-9 p-0 border-0 rounded-none hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors duration-150"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeItem(item.id);
                                  }}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <div className="w-9 h-9 flex items-center justify-center border-l border-r border-gray-200 bg-white">
                                  <span className="text-sm font-semibold text-gray-900">{getItemQuantity(item.id)}</span>
                                </div>
                                <button 
                                  className="w-9 h-9 p-0 border-0 rounded-none hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center text-blue-600 transition-colors duration-150"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addItem({
                                      id: item.id,
                                      name: item.name,
                                      price: item.price || 0,
                                      qty: 1,
                                      photo_url: item.photo_url,
                                      menu_id: item.id
                                    });
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addItem({
                                    id: item.id,
                                    name: item.name,
                                    price: item.price || 0,
                                    qty: 1,
                                    photo_url: item.photo_url,
                                    menu_id: item.id
                                  });
                                }}
                              >
                                <Plus className="h-5 w-5" />
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
              })}
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
              {filteredItems.map((item) => {
                const discount = item.base_price && item.base_price > item.price 
                  ? item.base_price - item.price 
                  : 0;

                return (
                  <Card 
                    key={item.id} 
                    className="bg-background shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    {/* Food Image */}
                    <div className="aspect-square w-full overflow-hidden rounded-t-lg">
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-image.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Package className="h-10 w-10 xl:h-12 xl:w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Food Info */}
                    <div className="p-3 xl:p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base xl:text-lg mb-2 truncate">
                            {item.name}
                          </h3>
                          
                          {/* Discount Badge */}
                          {discount > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                                Diskon Rp{discount.toLocaleString('id-ID')}
                              </span>
                              {item.base_price && (
                                <span className="text-muted-foreground text-xs xl:text-sm line-through">
                                  Rp{item.base_price.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Current Price */}
                          <p className="text-lg xl:text-xl font-bold">
                            Rp{(item.price || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex justify-end">
                        {getItemQuantity(item.id) > 0 ? (
                          <div className="flex items-center gap-2">
                            <button 
                              className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                            >
                              <Minus className="h-3 w-3 xl:h-4 xl:w-4" />
                            </button>
                            <span className="w-6 xl:w-8 text-center font-medium text-sm xl:text-base">{getItemQuantity(item.id)}</span>
                            <button 
                              className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem({
                                  id: item.id,
                                  name: item.name,
                                  price: item.price || 0,
                                  qty: 1,
                                  photo_url: item.photo_url,
                                  menu_id: item.id
                                });
                              }}
                            >
                              <Plus className="h-3 w-3 xl:h-4 xl:w-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                                addItem({
                                  id: item.id,
                                  name: item.name,
                                  price: item.price || 0,
                                  qty: 1,
                                  photo_url: item.photo_url,
                                  menu_id: item.id
                                });
                            }}
                          >
                            <Plus className="h-3 w-3 xl:h-4 xl:w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
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
}
