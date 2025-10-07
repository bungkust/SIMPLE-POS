import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';
import { ErrorModal } from '../ErrorModal';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface MenuFormModalProps {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
}

export function MenuFormModal({ item, categories, onClose }: MenuFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: '',
    details: '',
    onRetry: null as (() => void) | null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentTenant } = useAuth();

  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    short_description: item?.short_description || '',
    price: item?.price || 0,
    base_price: item?.base_price || 0,
    photo_url: item?.photo_url || '',
    category_id: item?.category_id || '',
    is_active: item?.is_active ?? true,
  });

  // Local state for discount percentage input (not stored in DB)
  const [discountInput, setDiscountInput] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentTenant) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan.');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage with tenant-specific folder
      const { error: uploadError } = await supabase.storage
        .from('menu-photos')
        .upload(`${currentTenant.tenant_slug}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('menu-photos')
        .getPublicUrl(`${currentTenant.tenant_slug}/${fileName}`);

      if (urlData?.publicUrl) {
        setFormData(prev => ({ ...prev, photo_url: urlData.publicUrl }));
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Photo uploaded successfully:', urlData.publicUrl);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Photo upload error:', error);
      }
      alert('Gagal mengupload foto. Silakan coba lagi.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 MenuFormModal: ========== FORM SUBMIT STARTED ==========');
      console.log('🔄 MenuFormModal: Form data:', formData);
      console.log('🔄 MenuFormModal: Discount input:', discountInput);
    }

    try {
      if (item) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 MenuFormModal: ========== UPDATE OPERATION ==========');
        }

        const { error } = await supabase
          .from('menu_items')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        if (error) throw error;

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ MenuFormModal: ========== UPDATE SUCCESSFUL ==========');
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 MenuFormModal: ========== INSERT OPERATION ==========');
        }

        const { error } = await supabase.from('menu_items').insert({
          ...formData,
          tenant_id: currentTenant.tenant_id
        });

        if (error) throw error;

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ MenuFormModal: ========== INSERT SUCCESSFUL ==========');
        }
      }

      onClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ MenuFormModal: ========== FORM SUBMIT ERROR ==========');
        console.error('❌ MenuFormModal: Error saving menu item:', error);
      }

      setErrorModal({
        isOpen: true,
        message: 'Gagal menyimpan menu',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        onRetry: () => {
          setErrorModal({ isOpen: false, message: '', details: '', onRetry: null });
          handleSubmit(e);
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {item ? 'Edit Menu' : 'Tambah Menu'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Menu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Kopi Susu Pendekar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Harga Dasar (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="20000"
              />
              <p className="text-xs text-slate-500 mt-1">Harga asli sebelum diskon</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Diskon (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={discountInput || 0}
                onChange={(e) => {
                  const percentage = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                  setDiscountInput(percentage);

                  // Auto-calculate final price when discount changes
                  if (formData.base_price && percentage > 0) {
                    const finalPrice = Math.round(formData.base_price * (1 - percentage / 100));
                    setFormData(prev => ({ ...prev, price: finalPrice }));
                  }
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
              />
              <p className="text-xs text-slate-500 mt-1">
                Diskon dalam persen (0-100%). Harga jual akan otomatis dihitung.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Harga Jual (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="15000"
              />
              <p className="text-xs text-slate-500 mt-1">Harga setelah diskon (otomatis dihitung jika ada diskon)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Deskripsi Singkat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Coffee Milk with Palm Sugar"
              />
              <p className="text-xs text-slate-500 mt-1">Deskripsi singkat untuk kartu menu (1-2 kalimat)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Deskripsi Lengkap
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
                placeholder="Deskripsi lengkap menu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Foto Menu
              </label>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="photoUpload"
                  onChange={handleFileUpload}
                />

                <label
                  htmlFor="photoUpload"
                  className={`flex flex-col items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="w-8 h-8 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {uploading ? 'Mengupload...' : 'Klik untuk upload foto'}
                  </span>
                  <span className="text-xs text-slate-400">JPG, PNG, WebP (max 5MB)</span>
                </label>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Atau masukkan URL foto
                </label>
                <input
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {formData.photo_url && (
                <div className="relative inline-block">
                  <img
                    src={formData.photo_url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, photo_url: '' })}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-green-500 border-slate-300 rounded focus:ring-green-500"
              />
              <label htmlFor="is_active" className="text-sm text-slate-700">
                Menu Aktif (tampil di daftar menu)
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '', details: '', onRetry: null })}
        title="Error"
        message={errorModal.message}
        details={errorModal.details}
        onRetry={errorModal.onRetry || undefined}
        showTechnicalDetails={true}
      />
    </div>
  );
}
