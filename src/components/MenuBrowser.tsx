import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MenuCard } from './MenuCard';
import { MenuDetailModal } from './MenuDetailModal';
import { MenuListItem } from './MenuListItem';

type MenuItem = {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  short_description: string | null;
  description: string | null;
  price: number;
  base_price: number;
  photo_url: string | null;
  is_active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  discount_id: string | null;
  search_text: string | null;
};

type Category = {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export function MenuBrowser() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  const { currentTenant } = useAuth();

  useEffect(() => {
    console.log('🔄 MenuBrowser: useEffect triggered, currentTenant:', currentTenant);
    loadData();
  }, [currentTenant]);

  const loadData = async () => {
    if (!currentTenant) {
      console.log('❌ MenuBrowser: No current tenant available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 MenuBrowser: Loading data for tenant:', currentTenant.tenant_slug, currentTenant.tenant_id);

      const [categoriesRes, itemsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('tenant_id', currentTenant.tenant_id).order('sort_order'),
        supabase.from('menu_items').select('*').eq('tenant_id', currentTenant.tenant_id).eq('is_active', true),
      ]);

      console.log('📊 MenuBrowser: Categories response:', categoriesRes);
      console.log('📊 MenuBrowser: Menu items response:', itemsRes);

      if (categoriesRes.data) {
        console.log('✅ MenuBrowser: Loaded categories:', categoriesRes.data.length);
        setCategories(categoriesRes.data);
      }
      if (itemsRes.data) {
        console.log('✅ MenuBrowser: Loaded menu items:', itemsRes.data.length);
        setMenuItems(itemsRes.data);
      }

      if (categoriesRes.error) {
        console.error('❌ MenuBrowser: Categories error:', categoriesRes.error);
      }
      if (itemsRes.error) {
        console.error('❌ MenuBrowser: Menu items error:', itemsRes.error);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ MenuBrowser: Error loading data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 sm:h-12 bg-slate-200 rounded-lg w-full"></div>
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 sm:h-10 bg-slate-200 rounded-full w-20 sm:w-24 flex-shrink-0"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 sm:h-64 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="text-center py-8 sm:py-12">
          <p className="text-slate-500 text-base sm:text-lg">
            Tidak dapat memuat menu: Tenant tidak tersedia
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Silakan refresh halaman atau hubungi admin jika masalah berlanjut
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-32">
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari menu…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-base sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 touch-manipulation"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-manipulation min-w-fit ${
            selectedCategory === ''
              ? 'bg-green-500 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua
        </button>
        {categories
          .filter(cat => cat.tenant_id === currentTenant?.tenant_id)
          .map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-manipulation min-w-fit ${
                selectedCategory === cat.id
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-slate-500 text-base sm:text-lg">
            {menuItems.length === 0
              ? 'Belum ada menu untuk tenant ini. Silakan hubungi admin untuk menambahkan menu.'
              : 'Tidak ada menu yang ditemukan'
            }
          </p>
          {menuItems.length === 0 && currentTenant && (
            <p className="text-sm text-slate-400 mt-2">
              Tenant: {currentTenant.tenant_slug}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Layout - Compact List */}
          <div className="block sm:hidden">
            {filteredItems.map((item) => (
              <MenuListItem
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>

          {/* Desktop Layout - Card Grid */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredItems.map((item) => (
                <MenuCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
              ))}
            </div>
          </div>
        </>
      )}

      {selectedItem && (
        <MenuDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
