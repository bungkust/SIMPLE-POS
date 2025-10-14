import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedTable } from '@/components/ui/advanced-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Eye, 
  EyeOff,
  Coffee,
  DollarSign,
  Tag,
  Image,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ColumnDef } from '@tanstack/react-table';
import { Database } from '@/lib/database.types';
import { MenuFormModal } from './MenuFormModalNew';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export function MenuTab() {
  const { currentTenant } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOptionsManager, setShowOptionsManager] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (currentTenant) {
      loadData();
    }
  }, [currentTenant]);

  const loadData = async () => {
    if (!currentTenant) {
      setLoading(false);
      return;
    }

    console.log('🔄 MenuTab: Starting to load menu data for tenant:', currentTenant.id);
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        supabase.from('menu_items').select('*').eq('tenant_id', currentTenant.id).order('created_at'),
        supabase.from('categories').select('*').eq('tenant_id', currentTenant.id).order('sort_order'),
      ]);

      if (itemsRes.error) {
        console.error('❌ MenuTab: Menu items query failed:', itemsRes.error);
      } else {
        console.log('✅ MenuTab: Menu items loaded successfully:', itemsRes.data?.length, 'items');
        if (itemsRes.data) setMenuItems(itemsRes.data);
      }

      if (categoriesRes.error) {
        console.error('❌ MenuTab: Categories query failed:', categoriesRes.error);
      } else {
        console.log('✅ MenuTab: Categories loaded successfully:', categoriesRes.data?.length, 'categories');
        if (categoriesRes.data) setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error('❌ MenuTab: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (itemId: string, currentState: boolean) => {
    console.log('🔄 MenuTab: Toggling active state for item:', itemId);
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_active: !currentState, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) {
        console.error('❌ MenuTab: Toggle active failed:', error);
        throw error;
      }

      console.log('✅ MenuTab: Toggle active successful');
      await loadData();
    } catch (error) {
      console.error('❌ MenuTab: Error toggling active state:', error);
      alert('Gagal mengupdate status menu');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', deleteItem.id);
      if (error) throw error;

      await loadData();
      setShowDeleteConfirm(false);
      setDeleteItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Gagal menghapus menu');
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  const columns: ColumnDef<MenuItem>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Menu',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
            {row.original.photo_url ? (
              <img 
                src={row.original.photo_url} 
                alt={row.original.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Coffee className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-slate-900">{row.original.name}</div>
            {row.original.short_description && (
              <div className="text-sm text-slate-500 line-clamp-1">
                {row.original.short_description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category_id',
      header: 'Kategori',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          <Tag className="w-3 h-3 mr-1" />
          {getCategoryName(row.original.category_id)}
        </Badge>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Harga',
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.base_price && row.original.price !== row.original.base_price && (
            <div className="text-xs text-slate-500 line-through mb-1">
              {formatRupiah(row.original.base_price)}
            </div>
          )}
          <div className="font-semibold text-primary">
            {formatRupiah(row.original.price)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.is_active ? 'active' : 'inactive'}
          label={row.original.is_active ? 'Aktif' : 'Nonaktif'}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingItem(row.original);
              setShowForm(true);
            }}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedMenuItem(row.original);
              setShowOptionsManager(true);
            }}
            className="h-8 w-8 p-0"
          >
            <Settings className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleActive(row.original.id, row.original.is_active)}
            className="h-8 w-8 p-0"
          >
            {row.original.is_active ? (
              <EyeOff className="w-4 h-4 text-orange-600" />
            ) : (
              <Eye className="w-4 h-4 text-green-600" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeleteItem({ id: row.original.id, name: row.original.name });
              setShowDeleteConfirm(true);
            }}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kelola Menu</h2>
          <p className="text-slate-600 mt-1">
            Kelola menu, kategori, dan opsi untuk tenant Anda
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Menu
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              Total Menu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{menuItems.length}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Menu Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {menuItems.filter(item => item.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Table */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-lg font-semibold text-slate-900">Daftar Menu</CardTitle>
          <CardDescription>
            Kelola semua menu item dengan mudah menggunakan tabel interaktif
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {menuItems.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada menu</h3>
              <p className="text-slate-600 mb-4">
                Mulai dengan menambahkan menu pertama Anda
              </p>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setShowForm(true);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Menu Pertama
              </Button>
            </div>
          ) : (
            <AdvancedTable
              data={menuItems}
              columns={columns}
              searchPlaceholder="Cari menu..."
              emptyMessage="Tidak ada menu yang ditemukan"
            />
          )}
        </CardContent>
      </Card>

      {/* Menu Form Modal */}
      {showForm && (
        <MenuFormModal
          item={editingItem}
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
            loadData();
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
            loadData();
          }}
          onError={(error) => {
            console.error('Menu form error:', error);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Hapus Menu
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus menu "{deleteItem?.name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Options Manager Modal */}
      {showOptionsManager && selectedMenuItem && (
        <OptionsManagerModal
          menuItem={selectedMenuItem}
          currentTenant={currentTenant}
          onClose={() => {
            setShowOptionsManager(false);
            setSelectedMenuItem(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Options Management Modal Component
function OptionsManagerModal({
  menuItem,
  currentTenant,
  onClose,
}: {
  menuItem: MenuItem;
  currentTenant: any;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<any[]>([]);
  const [optionItems, setOptionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOptions();
  }, [menuItem.id]);

  const loadOptions = async () => {
    try {
      const { data: optionsData } = await supabase
        .from('menu_options')
        .select('*')
        .eq('menu_item_id', menuItem.id)
        .order('sort_order');

      if (optionsData) {
        setOptions(optionsData);

        const optionIds = optionsData.map(opt => opt.id);
        if (optionIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('menu_option_items')
            .select('*')
            .in('menu_option_id', optionIds)
            .order('sort_order');

          if (itemsData) setOptionItems(itemsData);
        }
      }
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOptionItems = (optionId: string) => {
    return optionItems.filter(item => item.menu_option_id === optionId);
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Manage Options
          </DialogTitle>
          <DialogDescription>
            Kelola opsi dan pilihan untuk menu "{menuItem.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {options.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada opsi</h3>
              <p className="text-slate-600">
                Menu ini belum memiliki opsi konfigurasi
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {options.map((option) => {
                const items = getOptionItems(option.id);

                return (
                  <Card key={option.id} className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold text-slate-900">
                            {option.label}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {option.selection_type.replace('_', ' ')}
                            </Badge>
                            {option.is_required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-slate-600 mb-3">
                        {items.length} pilihan • Max selections: {option.max_selections}
                      </div>

                      {items.length > 0 && (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                {item.is_available && (
                                  <Badge variant="secondary" className="text-xs">
                                    Default
                                  </Badge>
                                )}
                                <span className="font-medium text-slate-900">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                  +{formatRupiah(item.additional_price)}
                                </span>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Tutup
          </Button>
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Opsi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
