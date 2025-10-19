import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable, createMobileCardConfig } from '@/components/ui/responsive-table';
import { useIsMobile } from '@/hooks/use-media-query';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Eye, 
  EyeOff,
  Coffee,
  Tag,
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
  const isMobile = useIsMobile();
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
      const { error } = await (supabase as any)
        .from('menu_items')
        .update({ 
          is_active: !currentState, 
          updated_at: new Date().toISOString() 
        })
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
        >
          {row.original.is_active ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
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
    <div className="space-y-6 w-full max-w-full overflow-hidden">


      {/* Menu Table */}
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle>Menu Items</CardTitle>
                <CardDescription>
                  Kelola menu, kategori, dan opsi untuk tenant Anda
                </CardDescription>
              </div>
              {!isMobile && (
                <div className="flex items-center space-x-2">
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
              )}
            </div>
            
            {/* Mobile Add Button */}
            {isMobile && (
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    setShowForm(true);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Menu
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden w-full max-w-full">
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
            <ResponsiveTable
              columns={columns}
              data={menuItems}
              searchKey="name"
              searchPlaceholder="Cari menu..."
              mobileCardConfig={createMobileCardConfig<MenuItem>({
                primaryField: 'name',
                secondaryField: 'price',
                statusField: 'is_active',
                statusMap: {
                  'true': { label: 'Aktif', variant: 'default' },
                  'false': { label: 'Nonaktif', variant: 'outline' }
                },
                subtitleField: 'price',
                getSubtitle: (item) => `${formatRupiah(item.price)} • ${getCategoryName(item.category_id)}`,
                getActions: (item) => (
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item);
                        setShowForm(true);
                      }}
                      className="h-8 w-8 p-0"
                      title="Edit Menu"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMenuItem(item);
                        setShowOptionsManager(true);
                      }}
                      className="h-8 w-8 p-0"
                      title="Manage Options"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(item.id, item.is_active)}
                      className="h-8 w-8 p-0"
                      title={item.is_active ? "Hide Menu" : "Show Menu"}
                    >
                      {item.is_active ? (
                        <EyeOff className="h-3 w-3 text-orange-600" />
                      ) : (
                        <Eye className="h-3 w-3 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteItem({ id: item.id, name: item.name });
                        setShowDeleteConfirm(true);
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Delete Menu"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
              emptyState={{
                icon: <Coffee className="w-12 h-12" />,
                title: "Belum ada menu",
                description: "Mulai dengan menambahkan menu pertama Anda",
                action: (
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
                )
              }}
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
  onClose,
}: {
  menuItem: MenuItem;
  onClose: () => void;
}) {
  const { currentTenant } = useAuth();
  const [options, setOptions] = useState<any[]>([]);
  const [optionItems, setOptionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddOptionForm, setShowAddOptionForm] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionType, setNewOptionType] = useState('single_required');
  const [newOptionRequired, setNewOptionRequired] = useState(true);
  const [newOptionMaxSelections, setNewOptionMaxSelections] = useState(1);
  const [addingOption, setAddingOption] = useState(false);
  
  // Option Items (sub-options) state
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemAvailable, setNewItemAvailable] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  
  // Edit states
  const [editingOption, setEditingOption] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditOptionForm, setShowEditOptionForm] = useState(false);
  const [showEditItemForm, setShowEditItemForm] = useState(false);
  const [deletingOption, setDeletingOption] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

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

        const optionIds = optionsData.map((opt: any) => opt.id);
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

  const handleAddOption = async () => {
    if (!newOptionLabel.trim() || !currentTenant) return;

    setAddingOption(true);
    try {
      const { error } = await (supabase as any)
        .from('menu_options')
        .insert({
          menu_item_id: menuItem.id,
          tenant_id: currentTenant.id,
          label: newOptionLabel.trim(),
          selection_type: newOptionType,
          is_required: newOptionRequired,
          max_selections: newOptionMaxSelections,
          sort_order: options.length
        });

      if (error) throw error;

      // Reset form
      setNewOptionLabel('');
      setNewOptionType('single_required');
      setNewOptionRequired(true);
      setNewOptionMaxSelections(1);
      setShowAddOptionForm(false);

      // Reload options
      await loadOptions();
    } catch (error) {
      console.error('Error adding option:', error);
    } finally {
      setAddingOption(false);
    }
  };

  const handleAddOptionItem = async () => {
    if (!newItemName.trim() || !selectedOptionId || !currentTenant) return;

    setAddingItem(true);
    try {
      const { error } = await (supabase as any)
        .from('menu_option_items')
        .insert({
          menu_option_id: selectedOptionId,
          tenant_id: currentTenant.id,
          name: newItemName.trim(),
          additional_price: newItemPrice,
          is_available: newItemAvailable,
          sort_order: getOptionItems(selectedOptionId).length
        });

      if (error) throw error;

      // Reset form
      setNewItemName('');
      setNewItemPrice(0);
      setNewItemAvailable(true);
      setSelectedOptionId(null);
      setShowAddItemForm(false);

      // Reload options
      await loadOptions();
    } catch (error) {
      console.error('Error adding option item:', error);
    } finally {
      setAddingItem(false);
    }
  };

  const openAddItemForm = (optionId: string) => {
    setSelectedOptionId(optionId);
    setShowAddItemForm(true);
  };

  const handleEditOption = (option: any) => {
    setEditingOption(option);
    setNewOptionLabel(option.label);
    setNewOptionType(option.selection_type);
    setNewOptionRequired(option.is_required);
    setNewOptionMaxSelections(option.max_selections);
    setShowEditOptionForm(true);
  };

  const handleUpdateOption = async () => {
    if (!editingOption || !newOptionLabel.trim()) return;

    setAddingOption(true);
    try {
      const { error } = await (supabase as any)
        .from('menu_options')
        .update({
          label: newOptionLabel.trim(),
          selection_type: newOptionType,
          is_required: newOptionRequired,
          max_selections: newOptionMaxSelections,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingOption.id);

      if (error) throw error;

      // Reset form
      setEditingOption(null);
      setNewOptionLabel('');
      setNewOptionType('single_required');
      setNewOptionRequired(true);
      setNewOptionMaxSelections(1);
      setShowEditOptionForm(false);

      // Reload options
      await loadOptions();
    } catch (error) {
      console.error('Error updating option:', error);
    } finally {
      setAddingOption(false);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    setDeletingOption(optionId);
    try {
      const { error } = await (supabase as any)
        .from('menu_options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;

      // Reload options
      await loadOptions();
    } catch (error) {
      console.error('Error deleting option:', error);
    } finally {
      setDeletingOption(null);
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemPrice(item.additional_price);
    setNewItemAvailable(item.is_available);
    setSelectedOptionId(item.menu_option_id);
    setShowEditItemForm(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItemName.trim()) return;

    setAddingItem(true);
    try {
      const { error } = await (supabase as any)
        .from('menu_option_items')
        .update({
          name: newItemName.trim(),
          additional_price: newItemPrice,
          is_available: newItemAvailable,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      // Reset form
      setEditingItem(null);
      setNewItemName('');
      setNewItemPrice(0);
      setNewItemAvailable(true);
      setSelectedOptionId(null);
      setShowEditItemForm(false);

      // Reload options
      await loadOptions();
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItem(itemId);
    try {
      const { error } = await (supabase as any)
        .from('menu_option_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Reload options
      await loadOptions();
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setDeletingItem(null);
    }
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
          {showAddItemForm || showEditItemForm ? (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  {showEditItemForm ? 'Edit Item Opsi' : 'Tambah Item Opsi'}
                </CardTitle>
                <CardDescription>
                  {showEditItemForm ? 'Edit pilihan opsi' : `Tambah pilihan untuk opsi "${options.find(opt => opt.id === selectedOptionId)?.label}"`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nama Item
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Contoh: Kecil, Sedang, Besar"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Harga Tambahan
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Harga tambahan untuk item ini (0 jika tidak ada tambahan)
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newItemAvailable}
                      onChange={(e) => setNewItemAvailable(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-700">Tersedia</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddItemForm(false);
                      setShowEditItemForm(false);
                      setEditingItem(null);
                      setSelectedOptionId(null);
                    }}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={showEditItemForm ? handleUpdateItem : handleAddOptionItem}
                    disabled={!newItemName.trim() || addingItem}
                    className="flex-1"
                  >
                    {addingItem ? 'Menyimpan...' : (showEditItemForm ? 'Update Item' : 'Tambah Item')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {showAddOptionForm || showEditOptionForm ? (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  {showEditOptionForm ? 'Edit Opsi' : 'Tambah Opsi Baru'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Label Opsi
                  </label>
                  <input
                    type="text"
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    placeholder="Contoh: Ukuran, Level Pedas, Topping"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipe Seleksi
                  </label>
                  <select
                    value={newOptionType}
                    onChange={(e) => setNewOptionType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="single_required">Single Required (Wajib pilih 1)</option>
                    <option value="single_optional">Single Optional (Opsional pilih 1)</option>
                    <option value="multiple">Multiple (Bisa pilih banyak)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newOptionRequired}
                      onChange={(e) => setNewOptionRequired(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-700">Wajib dipilih</span>
                  </label>
                </div>

                {newOptionType === 'multiple' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Max Selections
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newOptionMaxSelections}
                      onChange={(e) => setNewOptionMaxSelections(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddOptionForm(false);
                      setShowEditOptionForm(false);
                      setEditingOption(null);
                    }}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={showEditOptionForm ? handleUpdateOption : handleAddOption}
                    disabled={!newOptionLabel.trim() || addingOption}
                    className="flex-1"
                  >
                    {addingOption ? 'Menyimpan...' : (showEditOptionForm ? 'Update Opsi' : 'Tambah Opsi')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {options.length === 0 && !showAddOptionForm ? (
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditOption(option)}
                            disabled={showEditOptionForm || showAddOptionForm}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteOption(option.id)}
                            disabled={deletingOption === option.id}
                          >
                            {deletingOption === option.id ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            ) : (
                            <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-slate-600 mb-3">
                        {items.length} pilihan • Max selections: {option.max_selections}
                      </div>

                        <div className="space-y-2">
                        {items.length > 0 && items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                              <div className="flex items-center gap-3">
                              {item.is_available ? (
                                  <Badge variant="secondary" className="text-xs">
                                  Tersedia
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-slate-500">
                                  Tidak Tersedia
                                  </Badge>
                                )}
                                <span className="font-medium text-slate-900">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                {item.additional_price > 0 ? `+${formatRupiah(item.additional_price)}` : 'Tidak ada tambahan'}
                                </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditItem(item)}
                                disabled={showEditItemForm || showAddItemForm}
                              >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={deletingItem === item.id}
                              >
                                {deletingItem === item.id ? (
                                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        
                        {!showAddItemForm && !showEditItemForm && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddItemForm(option.id)}
                            className="w-full mt-2"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Item
                          </Button>
                        )}
                        </div>
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
          {!showAddOptionForm && !showAddItemForm && !showEditOptionForm && !showEditItemForm && (
            <Button 
              onClick={() => setShowAddOptionForm(true)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Opsi
          </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
