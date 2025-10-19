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
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto p-2 sm:p-4 pb-40 sm:pb-8">
        {/* Navigation Tabs - Dynamic from Database */}
        <div className="mb-3 sm:mb-6 relative">
          <div className="flex space-x-2 sm:space-x-8 border-b border-border overflow-x-auto scrollbar-hide pb-2 sm:pb-3">
            <button 
              className={`font-medium border-b-2 whitespace-nowrap text-sm sm:text-base ${
                selectedCategory === '' 
                  ? 'text-primary border-primary font-semibold' 
                  : 'text-muted-foreground hover:text-foreground border-transparent font-medium'
              }`}
              onClick={() => setSelectedCategory('')}
            >
              Semua Menu
            </button>
            {categories.map((category) => (
              <button 
                key={category.id}
                className={`font-medium border-b-2 whitespace-nowrap text-sm sm:text-base ${
                  selectedCategory === category.id 
                    ? 'text-primary border-primary font-semibold' 
                    : 'text-muted-foreground hover:text-foreground border-transparent font-medium'
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
        <div className="mb-3 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-5 sm:w-5" />
            <Input
              placeholder="Cari menu favoritmu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 h-8 sm:h-12 text-xs sm:text-base border-border focus:border-primary focus:ring-primary"
            />
            {searchQuery !== debouncedSearchQuery && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>


        {/* Menu Items - Food Delivery Style */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Package className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-sm sm:text-lg font-semibold mb-2">Tidak ada menu ditemukan</h3>
            <p className="text-muted-foreground text-xs sm:text-base">
              {searchQuery 
                ? `Tidak ada menu yang cocok dengan "${searchQuery}"`
                : 'Belum ada menu tersedia'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-6">
            {/* Section Title */}
            <h2 className="text-sm sm:text-2xl font-bold">
              {selectedCategory === '' 
                ? 'Semua Menu' 
                : categories.find(c => c.id === selectedCategory)?.name || 'Menu'
              }
            </h2>
            
            {/* Menu Items - Responsive Layout */}
            <div className="space-y-1 md:hidden">
              {/* Mobile: List Layout */}
              {filteredItems.map((item) => {
                const discount = item.base_price && item.base_price > item.price 
                  ? item.base_price - item.price 
                  : 0;

                return (
                  <div 
                    key={item.id} 
                    className="bg-background border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-2 sm:gap-4">
                        {/* Food Image */}
                        <div className="flex-shrink-0">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className="w-16 h-16 rounded-lg object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.png';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="h-4 w-4 sm:h-8 sm:w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Food Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-xs sm:text-lg mb-1">
                                {item.name}
                              </h3>
                              
                              {/* Discount Badge */}
                              {discount > 0 && (
                                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                  <span className="bg-primary/10 text-primary text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                                    Diskon Rp{discount.toLocaleString('id-ID')}
                                  </span>
                                  {item.base_price && (
                                    <span className="text-muted-foreground text-xs line-through">
                                      Rp{item.base_price.toLocaleString('id-ID')}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Current Price */}
                              <p className="text-xs sm:text-xl font-bold">
                                Rp{(item.price || 0).toLocaleString('id-ID')}
                              </p>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex-shrink-0">
                            {getItemQuantity(item.id) > 0 ? (
                              <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white h-10">
                                <button 
                                  className="w-10 h-10 p-0 border-0 rounded-none hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeItem(item.id);
                                  }}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <div className="w-10 h-10 flex items-center justify-center border-l border-r border-border bg-white">
                                  <span className="text-sm font-medium">{getItemQuantity(item.id)}</span>
                                </div>
                                <button 
                                  className="w-10 h-10 p-0 border-0 rounded-none hover:bg-muted/50 flex items-center justify-center text-primary"
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
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground"
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
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            )}
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
