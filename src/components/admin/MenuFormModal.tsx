import { useState, useRef, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
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

  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    short_description: item?.short_description || '',
    price: item?.price || 0,
    base_price: item?.base_price || 0,
    photo_url: item?.photo_url || '',
    category_id: item?.category_id || '',
    discount_id: item?.discount_id || '',
    is_active: item?.is_active ?? true,
  });

  const [availableDiscounts, setAvailableDiscounts] = useState<Database['public']['Tables']['menu_discounts']['Row'][]>([]);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_discounts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      if (data) setAvailableDiscounts(data);
    } catch (error) {
      console.error('Error loading discounts:', error);
    }
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!formData.name.trim()) {
      setErrorModal({
        isOpen: true,
        message: 'Nama menu tidak boleh kosong',
        details: 'Silakan masukkan nama menu yang valid',
        onRetry: () => {
          setErrorModal({ isOpen: false, message: '', details: '', onRetry: null });
          // Focus on name input field
          const nameInput = document.querySelector<HTMLInputElement>('#name');
          if (nameInput) nameInput.focus();
        }
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorModal({
        isOpen: true,
        message: 'Ukuran file terlalu besar',
        details: 'Ukuran file maksimal adalah 5MB. Silakan pilih file yang lebih kecil.',
        onRetry: () => {
          setErrorModal({ isOpen: false, message: '', details: '', onRetry: null });
          // Reset file input
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `menu-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('menu-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-photos')
        .getPublicUrl(fileName);

      // Update form data
      setFormData(prev => ({
        ...prev,
        photo_url: publicUrl,
      }));

      // Show success message (you could add a success toast here)
      console.log('✅ Photo uploaded successfully:', publicUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);

      // Show error modal instead of alert
      setErrorModal({
        isOpen: true,
        message: 'Gagal upload foto',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        onRetry: () => {
          setErrorModal({ isOpen: false, message: '', details: '', onRetry: null });
          // Retry file upload if file still exists
          if (fileInputRef.current?.files?.[0]) {
            handleFileUpload({ target: fileInputRef.current } as any);
          }
        }
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      photo_url: '',
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      setErrorModal({
        isOpen: true,
        message: 'Nama menu tidak boleh kosong',
        details: 'Silakan masukkan nama menu yang valid',
        onRetry: () => {
          setErrorModal({ isOpen: false, message: '', details: '', onRetry: null });
          // Focus on name input field
          const nameInput = document.querySelector<HTMLInputElement>('input[placeholder="Contoh: Kopi Susu Pendekar"]');
          if (nameInput) nameInput.focus();
        }
      });
      return;
    }

    if (!formData.category_id) {
      setErrorModal({
        isOpen: true,
        message: 'Kategori harus dipilih',
        details: 'Silakan pilih kategori untuk menu ini',
        onRetry: () => {
          setErrorModal({ isOpen: false, message: '', details: '', onRetry: null });
          // Focus on category select
          const categorySelect = document.querySelector<HTMLSelectElement>('select');
          if (categorySelect) categorySelect.focus();
        }
      });
      return;
    }

    setLoading(true);

    console.log('🔄 MenuFormModal: ========== FORM SUBMIT STARTED ==========');
    console.log('🔄 MenuFormModal: Item object:', item);
    console.log('🔄 MenuFormModal: Item ID:', item?.id);
    console.log('🔄 MenuFormModal: Item ID type:', typeof item?.id);
    console.log('🔄 MenuFormModal: Item ID length:', item?.id?.length);
    console.log('🔄 MenuFormModal: Form data:', formData);
    console.log('🔄 MenuFormModal: Submitting form:', { item: !!item, itemId: item?.id, formData });

    // Log each field individually to identify problematic fields
    console.log('🔍 MenuFormModal: ========== FIELD-BY-FIELD ANALYSIS ==========');
    console.log('🔍 Name:', formData.name, '(type:', typeof formData.name, 'length:', formData.name?.length, ')');
    console.log('🔍 Description:', formData.description, '(type:', typeof formData.description, ')');
    console.log('🔍 Short Description:', formData.short_description, '(type:', typeof formData.short_description, ')');
    console.log('🔍 Price:', formData.price, '(type:', typeof formData.price, ')');
    console.log('🔍 Base Price:', formData.base_price, '(type:', typeof formData.base_price, ')');
    console.log('🔍 Photo URL:', formData.photo_url, '(type:', typeof formData.photo_url, ')');
    console.log('🔍 Category ID:', formData.category_id, '(type:', typeof formData.category_id, 'length:', formData.category_id?.length, ')');
    console.log('🔍 Discount ID:', formData.discount_id, '(type:', typeof formData.discount_id, 'length:', formData.discount_id?.length, ')');
    console.log('🔍 Is Active:', formData.is_active, '(type:', typeof formData.is_active, ')');

    try {
      if (item) {
        console.log('🔄 MenuFormModal: ========== UPDATE OPERATION ==========');
        console.log('🔄 MenuFormModal: Updating existing menu item with ID:', item.id);

        // Validate that item.id exists and is not empty
        if (!item.id || item.id.trim() === '') {
          console.error('❌ MenuFormModal: ========== VALIDATION FAILED ==========');
          console.error('❌ MenuFormModal: Item ID is empty or invalid:', item.id);
          throw new Error('Item ID is missing or invalid');
        }

        console.log('🔄 MenuFormModal: ========== PREPARING UPDATE DATA ==========');
        console.log('🔄 MenuFormModal: Preparing update data:', {
          id: item.id,
          formData: formData,
          updatePayload: {
            ...formData,
            updated_at: new Date().toISOString(),
          }
        });

        // Clean form data - convert empty strings to null for UUID fields
        const cleanedFormData = {
          ...formData,
          category_id: formData.category_id || null,
          discount_id: formData.discount_id || null,
          photo_url: formData.photo_url || null,
          description: formData.description || null,
          short_description: formData.short_description || null,
          updated_at: new Date().toISOString(),
        };

        console.log('🔄 MenuFormModal: ========== CLEANED FORM DATA ==========');
        console.log('🔄 MenuFormModal: Cleaned data:', cleanedFormData);

        console.log('🔄 MenuFormModal: ========== EXECUTING SUPABASE UPDATE ==========');
        const { error } = await supabase
          .from('menu_items')
          .update(cleanedFormData)
          .eq('id', item.id);

        console.log('🔄 MenuFormModal: ========== SUPABASE RESPONSE ==========');
        console.log('🔄 MenuFormModal: Supabase update response:', { error });

        if (error) {
          console.error('❌ MenuFormModal: ========== UPDATE FAILED ==========');
          console.error('❌ MenuFormModal: Update failed:', error);
          throw error;
        }

        console.log('✅ MenuFormModal: ========== UPDATE SUCCESSFUL ==========');
        console.log('✅ MenuFormModal: Menu item updated successfully');
      } else {
        console.log('🔄 MenuFormModal: ========== INSERT OPERATION ==========');
        console.log('🔄 MenuFormModal: Creating new menu item');

        // Clean form data for insert - convert empty strings to null for UUID fields
        const cleanedInsertData = {
          ...formData,
          category_id: formData.category_id || null,
          discount_id: formData.discount_id || null,
          photo_url: formData.photo_url || null,
          description: formData.description || null,
          short_description: formData.short_description || null,
        };

        console.log('🔄 MenuFormModal: ========== CLEANED INSERT DATA ==========');
        console.log('🔄 MenuFormModal: Cleaned insert data:', cleanedInsertData);

        const { error } = await supabase.from('menu_items').insert(cleanedInsertData);

        if (error) {
          console.error('❌ MenuFormModal: ========== INSERT FAILED ==========');
          console.error('❌ MenuFormModal: Insert failed:', error);
          throw error;
        }

        console.log('✅ MenuFormModal: ========== INSERT SUCCESSFUL ==========');
        console.log('✅ MenuFormModal: Menu item created successfully');
      }

      console.log('🔄 MenuFormModal: ========== FORM SUBMIT COMPLETED ==========');
      onClose();
    } catch (error) {
      console.error('❌ MenuFormModal: ========== FORM SUBMIT ERROR ==========');
      console.error('❌ MenuFormModal: Error saving menu item:', error);

      // Show error modal instead of alert
      setErrorModal({
        isOpen: true,
        message: 'Gagal menyimpan menu',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        onRetry: () => {
          setErrorModal({ isOpen: false, message: '', details: '', onRetry: null });
          // Re-submit the form
          handleSubmit(new Event('submit') as any);
        }
      });
    } finally {
      console.log('🔄 MenuFormModal: ========== FORM SUBMIT FINISHED ==========');
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
                step="1000"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="22000"
              />
              <p className="text-xs text-slate-500 mt-1">Harga asli sebelum diskon</p>
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
                Diskon
              </label>
              <select
                value={formData.discount_id}
                onChange={(e) => setFormData({ ...formData, discount_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tanpa Diskon</option>
                {availableDiscounts.map((discount) => (
                  <option key={discount.id} value={discount.id}>
                    {discount.name} - {discount.discount_type === 'percentage'
                      ? `${discount.discount_value}%`
                      : `Rp ${discount.discount_value.toLocaleString()}`
                    }
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Pilih diskon yang akan diterapkan pada menu ini</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
                placeholder="Deskripsi singkat menu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Foto Menu
              </label>

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="photoUpload"
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

              {/* URL Input (Alternative) */}
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

              {/* Photo Preview */}
              {formData.photo_url && (
                <div className="relative inline-block">
                  <img
                    src={formData.photo_url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
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

      {/* Error Modal */}
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