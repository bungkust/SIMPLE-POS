import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDialog } from '../ConfirmDialog';
import { formatRupiah } from '../../lib/utils';
import { Database } from '../../lib/database.types';
import { MenuFormModal } from './MenuFormModal';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type MenuOption = Database['public']['Tables']['menu_options']['Row'];
type MenuOptionItem = Database['public']['Tables']['menu_option_items']['Row'];

export function MenuTab() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: string | null; itemName: string }>({
    isOpen: false,
    itemId: null,
    itemName: ''
  });
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [showOptionsManager, setShowOptionsManager] = useState(false);
  const { user, currentTenant } = useAuth();

  useEffect(() => {
    loadData();
  }, [currentTenant]);

  const loadData = async () => {
    console.log('🔄 MenuTab: Starting to load menu data...');
    try {
      console.log('🔄 MenuTab: Starting to load menu data...');

      const [itemsRes, categoriesRes] = await Promise.all([
        supabase.from('menu_items').select('*').order('created_at'),
        supabase.from('categories').select('*').order('sort_order'),
      ]);

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 MenuTab: Menu items query result:', { dataLength: itemsRes.data?.length, error: itemsRes.error });
        console.log('🔄 MenuTab: Categories query result:', { dataLength: categoriesRes.data?.length, error: categoriesRes.error });
      }

      if (itemsRes.error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ MenuTab: Menu items query failed:', itemsRes.error);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ MenuTab: Menu items loaded successfully:', itemsRes.data?.length, 'items');
          if (itemsRes.data) {
            console.log('🔍 MenuTab: Menu items data:', itemsRes.data.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              base_price: item.base_price,
              formatted_price: formatRupiah(item.price)
            })));
          }
        }
        if (itemsRes.data) setMenuItems(itemsRes.data);
      }

      if (categoriesRes.error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ MenuTab: Categories query failed:', categoriesRes.error);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ MenuTab: Categories loaded successfully:', categoriesRes.data?.length, 'categories');
        }
        if (categoriesRes.data) setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error('❌ MenuTab: Error loading data:', error);
    } finally {
      console.log('🔄 MenuTab: Setting loading to false');
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

  const deleteItem = (itemId: string, itemName: string) => {
    setDeleteConfirm({
      isOpen: true,
      itemId,
      itemName
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.itemId) return;

    try {
      const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];
      
      if (adminEmails.includes(user?.email || '')) {
        const { error } = await supabase.from('menu_items').delete().eq('id', deleteConfirm.itemId);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
      } else {
        const { error } = await supabase.from('menu_items').delete().eq('id', deleteConfirm.itemId);
        if (error) throw error;
      }

      await loadData();
      alert('Menu berhasil dihapus');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Gagal menghapus menu. Pastikan Anda login sebagai admin.');
    } finally {
      setDeleteConfirm({ isOpen: false, itemId: null, itemName: '' });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    loadData();
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Kelola Menu</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu</span>
        </button>
      </div>

      {menuItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-600">Belum ada menu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-[4/3] relative bg-slate-100">
                {item.photo_url ? (
                  <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-slate-400 text-sm">No image</span>
                  </div>
                )}
                {!item.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">NONAKTIF</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="mb-2">
                  <span className="text-xs text-slate-500">{getCategoryName(item.category_id)}</span>
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  {item.short_description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mt-1">{item.short_description}</p>
                  )}
                </div>

                <div className="mb-3">
                  {item.base_price && item.price !== item.base_price && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-slate-500 line-through">{formatRupiah(item.base_price)}</span>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        {item.base_price && item.price ?
                          `${Math.round(((item.base_price - item.price) / item.base_price) * 100)}% OFF`
                          : 'Diskon'
                        }
                      </span>
                    </div>
                  )}
                  <p className="font-bold text-green-600">{formatRupiah(item.price)}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMenuItem(item);
                      setShowOptionsManager(true);
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Options</span>
                  </button>

                  <button
                    onClick={() => toggleActive(item.id, item.is_active)}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      item.is_active
                        ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {item.is_active ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => deleteItem(item.id, item.name)}
                    className="flex items-center justify-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <MenuFormModal
          item={editingItem}
          categories={categories}
          onClose={handleFormClose}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, itemId: null, itemName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Hapus Menu"
        message={`Apakah Anda yakin ingin menghapus menu "${deleteConfirm.itemName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      {/* Options Management Modal */}
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
  onClose
}: {
  menuItem: MenuItem;
  currentTenant: any;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<MenuOption[]>([]);
  const [optionItems, setOptionItems] = useState<MenuOptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Option form state
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [editingOption, setEditingOption] = useState<MenuOption | null>(null);
  const [optionFormData, setOptionFormData] = useState({
    label: '',
    selection_type: 'single_required' as 'single_required' | 'single_optional' | 'multiple',
    max_selections: 1,
    is_required: false
  });

  // Option item form state
  const [showOptionItemForm, setShowOptionItemForm] = useState(false);
  const [editingOptionItem, setEditingOptionItem] = useState<MenuOptionItem | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [optionItemFormData, setOptionItemFormData] = useState({
    name: '',
    additional_price: 0,
    is_available: true  // Use is_available instead of is_default
  });

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
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading options:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 OptionsManager: Submitting option form:', { editingOption: !!editingOption, optionFormData });
    }

    try {
      if (editingOption) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 OptionsManager: Updating option with ID:', editingOption.id);
        }
        const { error } = await supabase
          .from('menu_options')
          .update({
            ...optionFormData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOption.id);

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ OptionsManager: Option update failed:', error);
          }
          throw error;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ OptionsManager: Option updated successfully');
        }
      } else {
        const maxOrder = Math.max(...options.map(opt => opt.sort_order), 0);
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 OptionsManager: Creating new option for menu item:', menuItem.id);
          console.log('🔄 OptionsManager: Current tenant:', currentTenant);
          console.log('🔄 OptionsManager: Current tenant ID:', currentTenant?.tenant_id);
        }
        const { error } = await supabase
          .from('menu_options')
          .insert({
            ...optionFormData,
            menu_item_id: menuItem.id,
            tenant_id: currentTenant?.tenant_id,
            sort_order: maxOrder + 1
          });

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ OptionsManager: Option creation failed:', error);
          }
          throw error;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ OptionsManager: Option created successfully');
        }
      }

      await loadOptions();
      handleOptionFormClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ OptionsManager: Error saving option:', error);
      }
      alert('Gagal menyimpan opsi');
    }
  };

  const handleOptionFormClose = () => {
    setShowOptionForm(false);
    setEditingOption(null);
    setOptionFormData({
      label: '',
      selection_type: 'single_required',
      max_selections: 1,
      is_required: false
    });
  };

  const handleEditOption = (option: MenuOption) => {
    setEditingOption(option);
    setOptionFormData({
      label: option.label,
      selection_type: option.selection_type,
      max_selections: option.max_selections,
      is_required: option.is_required
    });
    setShowOptionForm(true);
  };

  const handleDeleteOption = async (optionId: string, optionLabel: string) => {
    if (!confirm(`Hapus opsi "${optionLabel}"?`)) return;

    try {
      const { error } = await supabase
        .from('menu_options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;

      await loadOptions();
    } catch (error) {
      console.error('Error deleting option:', error);
      alert('Gagal menghapus opsi');
    }
  };

  const handleOptionItemFormClose = () => {
    setShowOptionItemForm(false);
    setEditingOptionItem(null);
    setSelectedOptionId(null);
    setOptionItemFormData({
      name: '',
      additional_price: 0,
      is_available: true
    });
  };

  const handleEditOptionItem = (optionItem: MenuOptionItem) => {
    setEditingOptionItem(optionItem);
    setSelectedOptionId(optionItem.menu_option_id);
    setOptionItemFormData({
      name: optionItem.name,
      additional_price: optionItem.additional_price,
      is_available: optionItem.is_available // Map is_available to form state
    });
    setShowOptionItemForm(true);
  };

  const handleDeleteOptionItem = async (optionItemId: string, optionItemName: string) => {
    if (!confirm(`Hapus pilihan "${optionItemName}"?`)) return;

    try {
      const { error } = await supabase
        .from('menu_option_items')
        .delete()
        .eq('id', optionItemId);

      if (error) throw error;

      await loadOptions();
    } catch (error) {
      console.error('Error deleting option item:', error);
      alert('Gagal menghapus pilihan opsi');
    }
  };

  const handleAddOptionItem = (optionId: string) => {
    setSelectedOptionId(optionId);
    setShowOptionItemForm(true);
  };

  const handleOptionItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOptionId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ OptionsManager: No option ID selected');
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 OptionsManager: Submitting option item form:', {
        editingOptionItem: !!editingOptionItem,
        selectedOptionId,
        optionItemFormData
      });
    }

    try {
      if (editingOptionItem) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 OptionsManager: Updating option item with ID:', editingOptionItem.id);
        }
        const { error } = await supabase
          .from('menu_option_items')
          .update({
            name: optionItemFormData.name,
            additional_price: optionItemFormData.additional_price,
            is_available: optionItemFormData.is_available,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOptionItem.id);

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ OptionsManager: Option item update failed:', error);
          }
          throw error;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ OptionsManager: Option item updated successfully');
        }
      } else {
        const maxOrder = Math.max(...optionItems.filter(item => item.menu_option_id === selectedOptionId).map(item => item.sort_order), 0);
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 OptionsManager: Creating new option item for option:', selectedOptionId);
          console.log('🔄 OptionsManager: Current tenant for option item:', currentTenant);
          console.log('🔄 OptionsManager: Current tenant ID for option item:', currentTenant?.tenant_id);
        }
        const { error } = await supabase
          .from('menu_option_items')
          .insert({
            name: optionItemFormData.name,
            additional_price: optionItemFormData.additional_price,
            is_available: optionItemFormData.is_available,
            menu_option_id: selectedOptionId,
            tenant_id: currentTenant?.tenant_id,
            sort_order: maxOrder + 1
          });

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ OptionsManager: Option item creation failed:', error);
          }
          throw error;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ OptionsManager: Option item created successfully');
        }
      }

      await loadOptions();
      handleOptionItemFormClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ OptionsManager: Error saving option item:', error);
      }
      alert('Gagal menyimpan pilihan opsi: ' + (error as Error).message);
    }
  };

  const getOptionItems = (optionId: string) => {
    return optionItems.filter(item => item.menu_option_id === optionId);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center sm:justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Manage Options</h2>
            <p className="text-sm text-slate-600">{menuItem.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Menu Options</h3>
            <button
              onClick={() => setShowOptionForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Option</span>
            </button>
          </div>

          {options.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">No options configured for this menu item.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {options.map((option) => {
                const items = getOptionItems(option.id);

                return (
                  <div key={option.id} className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{option.label}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span>Type: {option.selection_type.replace('_', ' ')}</span>
                          {option.is_required && <span className="text-red-500">• Required</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddOptionItem(option.id)}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          Add Choice
                        </button>
                        <button
                          onClick={() => handleEditOption(option)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOption(option.id, option.label)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-slate-600 mb-3">
                      {items.length} choices • Max selections: {option.max_selections}
                    </div>

                    {/* Option Items */}
                    {items.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                {item.is_available && (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                    Default
                                  </span>
                                )}
                                <span className="font-medium text-slate-900">{item.name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                  +Rp {item.additional_price.toLocaleString()}
                                </span>
                                <button
                                  onClick={() => handleEditOptionItem(item)}
                                  className="p-1 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOptionItem(item.id, item.name)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Option Form Modal */}
      {showOptionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingOption ? 'Edit Option' : 'Add Option'}
              </h3>
              <button
                onClick={handleOptionFormClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleOptionSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Option Label
                </label>
                <input
                  type="text"
                  value={optionFormData.label}
                  onChange={(e) => setOptionFormData(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Size, Topping, Sugar Level"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Selection Type
                </label>
                <select
                  value={optionFormData.selection_type}
                  onChange={(e) => setOptionFormData(prev => ({ ...prev, selection_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="single_required">Pick 1 (Required)</option>
                  <option value="single_optional">Optional, max 1</option>
                  <option value="multiple">Multiple choice</option>
                </select>
              </div>

              {optionFormData.selection_type === 'multiple' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Selections
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={optionFormData.max_selections}
                    onChange={(e) => setOptionFormData(prev => ({ ...prev, max_selections: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={optionFormData.is_required}
                    onChange={(e) => setOptionFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                    className="w-4 h-4 text-green-500 border-slate-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-slate-700">Required option</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleOptionFormClose}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {editingOption ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Option Item Form Modal */}
      {showOptionItemForm && selectedOptionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingOptionItem ? 'Edit Choice' : 'Add Choice'}
              </h3>
              <button
                onClick={handleOptionItemFormClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleOptionItemSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Choice Name
                </label>
                <input
                  type="text"
                  value={optionItemFormData.name}
                  onChange={(e) => setOptionItemFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Regular, Large, Extra Cheese"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Price (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={optionItemFormData.additional_price}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setOptionItemFormData(prev => ({ ...prev, additional_price: Math.max(0, value) }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan biaya tambahan dalam Rupiah. Sistem akan membulatkan ke kelipatan Rp 100 untuk kemudahan pembayaran.
                </p>
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={optionItemFormData.is_available}
                    onChange={(e) => setOptionItemFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                    className="w-4 h-4 text-green-500 border-slate-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-slate-700">Set as default choice</span>
                </label>
                <p className="text-xs text-slate-500 mt-1">Pilihan ini akan dipilih secara otomatis</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleOptionItemFormClose}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {editingOptionItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
