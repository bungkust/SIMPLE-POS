import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ConfirmDialog } from '../ConfirmDialog';
import { Database } from '../../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryFormData {
  name: string;
  sort_order: number;
}

export function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({ name: '', sort_order: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; categoryId: string | null; categoryName: string }>({
    isOpen: false,
    categoryId: null,
    categoryName: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 CategoriesTab: Starting to load categories...');
    }
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 CategoriesTab: Querying categories table...');
      }
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 CategoriesTab: Categories query result:', { dataLength: data?.length, error });
      }

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ CategoriesTab: Categories query failed:', error);
        }
        throw error;
      }

      if (data) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ CategoriesTab: Categories loaded successfully:', data.length, 'categories');
        }
        setCategories(data);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ CategoriesTab: Error loading categories:', error);
      }
      setCategories([]);
    } finally {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 CategoriesTab: Setting loading to false');
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Nama kategori tidak boleh kosong');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            sort_order: formData.sort_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Create new category
        const maxOrder = Math.max(...categories.map(c => c.sort_order), 0);
        const { error } = await supabase
          .from('categories')
          .insert({
            name: formData.name.trim(),
            sort_order: maxOrder + 1
          });

        if (error) throw error;
      }

      await loadCategories();
      handleFormClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving category:', error);
      }
      alert('Gagal menyimpan kategori');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      sort_order: category.sort_order
    });
    setShowForm(true);
  };

  const handleDelete = (categoryId: string, categoryName: string) => {
    setDeleteConfirm({
      isOpen: true,
      categoryId,
      categoryName
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.categoryId) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteConfirm.categoryId);

      if (error) throw error;

      await loadCategories();
      alert('Kategori berhasil dihapus');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting category:', error);
      }
      alert('Gagal menghapus kategori');
    } finally {
      setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: '' });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', sort_order: 0 });
  };

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentCategory = categories[currentIndex];
    const targetCategory = categories[targetIndex];

    try {
      // Swap sort orders
      await Promise.all([
        supabase
          .from('categories')
          .update({ sort_order: targetCategory.sort_order })
          .eq('id', currentCategory.id),
        supabase
          .from('categories')
          .update({ sort_order: currentCategory.sort_order })
          .eq('id', targetCategory.id)
      ]);

      await loadCategories();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error moving category:', error);
      }
      alert('Gagal mengubah urutan kategori');
    }
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
        <h2 className="text-lg font-semibold text-slate-900">Kelola Kategori</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors touch-manipulation"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-600">Belum ada kategori</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category, index) => (
            <div key={category.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{category.name}</h3>
                  <p className="text-sm text-slate-500">Urutan: {category.sort_order}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={index === 0}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={index === categories.length - 1}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleEdit(category)}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    className="flex items-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
              <button
                onClick={handleFormClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan nama kategori"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="sortOrder" className="block text-sm font-medium text-slate-700 mb-2">
                  Urutan
                </label>
                <input
                  type="number"
                  id="sortOrder"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleFormClose}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {editingCategory ? 'Update' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteConfirm.categoryName}"? Menu yang menggunakan kategori ini akan menjadi tidak terkategori.`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
