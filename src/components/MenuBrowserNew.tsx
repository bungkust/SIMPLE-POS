import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star,
  Clock,
  DollarSign,
  Package,
  AlertCircle,
  Loader2,
  Plus,
  Minus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '@/lib/form-utils';
import { getTenantInfo, getTenantId } from '../lib/tenantUtils';
import { MenuDetailSheet } from './MenuDetailSheet';
import { Database } from '../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export function MenuBrowser() {
  const { addItem, removeItem, getItemQuantity } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

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
        const tenantId = resolvedTenantInfo.tenant_id;
        console.log('MenuBrowser: Got tenant ID:', tenantId);
        
        if (!tenantId) {
          console.error('No tenant ID found for tenant:', resolvedTenantInfo);
          console.log('This might be normal for public access - will show empty menu');
          setLoading(false);
          return;
        }

        setResolvedTenantId(tenantId);

        // Load categories
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
            console.log('MenuBrowser: Category names:', categoriesData.map(c => c.name));
          }
          setCategories(categoriesData || []);
        }

        // Load menu items
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
        }

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
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
        <div className="mb-3 sm:mb-6">
          <div className="flex space-x-2 sm:space-x-8 border-b border-border overflow-x-auto scrollbar-hide">
            <button 
              className={`pb-2 sm:pb-3 font-medium border-b-2 whitespace-nowrap text-xs sm:text-base ${
                selectedCategory === '' 
                  ? 'text-primary border-primary' 
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
              onClick={() => setSelectedCategory('')}
            >
              Semua Menu
            </button>
            {categories.map((category) => (
              <button 
                key={category.id}
                className={`pb-2 sm:pb-3 font-medium border-b-2 whitespace-nowrap text-xs sm:text-base ${
                  selectedCategory === category.id 
                    ? 'text-primary border-primary' 
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name.toUpperCase()}
              </button>
            ))}
          </div>
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
            <div className="space-y-3 sm:space-y-4 md:hidden">
              {/* Mobile: List Layout */}
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
                    <CardContent className="p-2 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        {/* Food Image */}
                        <div className="flex-shrink-0">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className="w-12 h-12 sm:w-20 sm:h-20 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded bg-muted flex items-center justify-center">
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
                                  <span className="bg-orange-100 text-orange-800 text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded">
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
                              <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white">
                                <button 
                                  className="w-6 h-6 sm:w-8 sm:h-8 p-0 border-0 rounded-none hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeItem(item.id);
                                  }}
                                >
                                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                                <div className="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center border-l border-r border-border bg-white">
                                  <span className="font-medium text-xs sm:text-base">{getItemQuantity(item.id)}</span>
                                </div>
                                <button 
                                  className="w-6 h-6 sm:w-8 sm:h-8 p-0 border-0 rounded-none hover:bg-muted/50 flex items-center justify-center text-primary"
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
                    </CardContent>
                  </Card>
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
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
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
                              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
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
        item={selectedItem}
        isOpen={isDetailSheetOpen}
        onClose={() => {
          setIsDetailSheetOpen(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
}
