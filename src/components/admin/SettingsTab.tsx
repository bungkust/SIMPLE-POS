import { useState, useRef } from 'react';
import { Coffee, Store, ShoppingBag, Utensils, Save, RotateCcw, Upload, X } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { NotificationDialog } from '../NotificationDialog';

const iconOptions = [
  { value: 'Coffee', label: 'Coffee', icon: Coffee },
  { value: 'Store', label: 'Store', icon: Store },
  { value: 'ShoppingBag', label: 'Shopping Bag', icon: ShoppingBag },
  { value: 'Utensils', label: 'Utensils', icon: Utensils },
];

export function SettingsTab() {
  const { config, updateConfig } = useConfig();
  const { currentTenant } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    storeName: config.storeName,
    storeIcon: config.storeIcon,
    storeIconType: config.storeIconType,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedIconUrl, setUploadedIconUrl] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      updateConfig({
        storeName: formData.storeName,
        storeIcon: formData.storeIcon,
        storeIconType: formData.storeIconType,
      });

      showNotification('Berhasil!', 'Pengaturan berhasil disimpan!', 'success');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving settings:', error);
      }
      showNotification('Gagal!', 'Gagal menyimpan pengaturan. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!currentTenant) return;

    // Get tenant-specific defaults from ConfigContext
    const getDefaultConfigForTenant = (tenantSlug: string) => {
      const tenantDefaults: Record<string, any> = {
        'kopipendekar': {
          storeName: 'Kopi Pendekar',
          storeIcon: 'Coffee',
          storeIconType: 'predefined'
        },
        'matchae': {
          storeName: 'Matchae',
          storeIcon: 'Coffee',
          storeIconType: 'predefined'
        },
        'testcafe': {
          storeName: 'Test Cafe',
          storeIcon: 'Store',
          storeIconType: 'predefined'
        },
        'demostore': {
          storeName: 'Demo Store',
          storeIcon: 'ShoppingBag',
          storeIconType: 'predefined'
        }
      };

      return tenantDefaults[tenantSlug] || {
        storeName: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1).replace('-', ' '),
        storeIcon: 'Coffee',
        storeIconType: 'predefined'
      };
    };

    const defaultConfig = getDefaultConfigForTenant(currentTenant.tenant_slug);
    setFormData(defaultConfig);
    setUploadedIconUrl(null);

    // Update the config context as well
    updateConfig(defaultConfig);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'storeIcon' && value !== 'uploaded' && { storeIconType: 'predefined' }),
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentTenant) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('Error!', 'File harus berupa gambar.', 'error');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Error!', 'Ukuran file maksimal 2MB.', 'error');
      return;
    }

    setUploading(true);

    try {
      // Create unique filename with tenant prefix
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentTenant.tenant_slug}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      if (process.env.NODE_ENV === 'development') {
        console.log('Uploading file:', fileName, 'to bucket: store-icons for tenant:', currentTenant.tenant_slug);
      }

      // Upload to Supabase Storage with tenant organization
      const { data, error } = await supabase.storage
        .from('store-icons')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Storage upload error:', error);
        }
        throw error;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Upload successful:', data);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('store-icons')
        .getPublicUrl(fileName);

      if (process.env.NODE_ENV === 'development') {
        console.log('Public URL:', publicUrl);
      }

      // Update form data
      setFormData(prev => ({
        ...prev,
        storeIcon: publicUrl,
        storeIconType: 'uploaded',
      }));

      setUploadedIconUrl(publicUrl);
      showNotification('Berhasil!', 'Icon berhasil diupload!', 'success');

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error uploading icon:', error);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification('Gagal!', `Gagal upload icon: ${errorMessage}. Pastikan bucket 'store-icons' sudah dibuat dan RLS policies sudah benar.`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeUploadedIcon = () => {
    setFormData(prev => ({
      ...prev,
      storeIcon: 'Coffee',
      storeIconType: 'predefined',
    }));
    setUploadedIconUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Pengaturan Toko</h2>
          {currentTenant && (
            <div className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              {currentTenant.tenant_name}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Name */}
          <div>
            <label htmlFor="storeName" className="block text-sm font-medium text-slate-700 mb-2">
              Nama Toko
            </label>
            <input
              type="text"
              id="storeName"
              value={formData.storeName}
              onChange={(e) => handleInputChange('storeName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Masukkan nama toko"
              required
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Icon Toko
            </label>

            {/* Predefined Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {iconOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = formData.storeIconType === 'predefined' && formData.storeIcon === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('storeIcon', option.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <IconComponent className={`w-6 h-6 ${isSelected ? 'text-green-500' : 'text-slate-600'}`} />
                    <span className={`text-xs text-center ${isSelected ? 'text-green-700 font-medium' : 'text-slate-600'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Upload Section */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="iconUpload"
                />

                {uploadedIconUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img
                        src={uploadedIconUrl}
                        alt="Uploaded icon"
                        className="w-16 h-16 object-cover rounded-lg border-2 border-green-500"
                      />
                      <button
                        type="button"
                        onClick={removeUploadedIcon}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-green-600 font-medium">✓ Icon berhasil diupload</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <div>
                      <label htmlFor="iconUpload" className="cursor-pointer">
                        <span className="text-sm font-medium text-green-600 hover:text-green-700">
                          Upload Icon Custom
                        </span>
                      </label>
                      <p className="text-xs text-slate-500 mt-1">
                        PNG, JPG, SVG max 2MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Preview Header
            </label>
            <div className="bg-slate-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                {formData.storeIconType === 'uploaded' && formData.storeIcon ? (
                  <img
                    src={formData.storeIcon}
                    alt="Store icon"
                    className="w-6 h-6 object-cover"
                  />
                ) : (
                  (() => {
                    const IconComponent = iconOptions.find(opt => opt.value === formData.storeIcon)?.icon || Coffee;
                    return <IconComponent className="w-6 h-6 text-green-500" />;
                  })()
                )}
                <h1 className="text-xl font-bold text-slate-900">{formData.storeName}</h1>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Notification Dialog */}
      {notification && (
        <NotificationDialog
          isOpen={notification.isOpen}
          onClose={() => setNotification(null)}
          title={notification.title}
          message={notification.message}
          type={notification.type}
        />
      )}

      {/* Information */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Catatan:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Setiap tenant memiliki pengaturan toko yang terpisah</li>
              <li>• Pengaturan disimpan secara lokal per tenant</li>
              <li>• Icon custom diupload ke Supabase Storage dengan organisasi per tenant</li>
              <li>• Jika diperlukan, pengaturan dapat direset ke default tenant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
