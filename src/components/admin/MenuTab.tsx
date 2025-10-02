import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDialog } from '../ConfirmDialog';
import { formatRupiah } from '../../lib/utils';
import { Database } from '../../lib/database.types';
import { MenuFormModal } from './MenuFormModal';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

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
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        supabase.from('menu_items').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ]);

      if (itemsRes.data) setMenuItems(itemsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (itemId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_active: !currentState, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error toggling active state:', error);
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
      // For admin users, we need to ensure proper authentication
      const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];

      if (adminEmails.includes(user?.email || '')) {
        // Use service role key for admin operations if needed
        // Or ensure the user is properly authenticated in Supabase
        const { error } = await supabase.from('menu_items').delete().eq('id', deleteConfirm.itemId);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
      } else {
        // For regular authenticated users
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
                  {item.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mt-1">{item.description}</p>
                  )}
                </div>
                <p className="font-bold text-green-600 mb-3">{formatRupiah(item.price)}</p>

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
    </div>
  );
}