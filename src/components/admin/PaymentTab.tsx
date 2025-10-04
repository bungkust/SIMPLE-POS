import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ConfirmDialog } from '../ConfirmDialog';

// Define PaymentMethod interface since it's not in generated types yet
interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  payment_type: 'TRANSFER' | 'QRIS' | 'COD';
  is_active: boolean;
  sort_order: number;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  qris_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export function PaymentTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    payment_type: 'TRANSFER' as 'TRANSFER' | 'QRIS' | 'COD',
    is_active: true,
    sort_order: 0,
    bank_name: '',
    account_number: '',
    account_holder: '',
    qris_image_url: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: string | null; itemName: string }>({
    isOpen: false,
    itemId: null,
    itemName: ''
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    console.log('🔄 PaymentTab: Starting to load payment methods...');
    try {
      console.log('🔄 PaymentTab: Querying payment_methods table...');
      const { data, error } = await (supabase as any).from('payment_methods').select('*').order('sort_order');

      console.log('🔄 PaymentTab: Payment methods query result:', { dataLength: data?.length, error });

      if (error) {
        console.error('❌ PaymentTab: Payment methods query failed:', error);
        throw error;
      }

      if (data) {
        console.log('✅ PaymentTab: Payment methods loaded successfully:', data.length, 'methods');
        setPaymentMethods((data || []) as PaymentMethod[]);
      }
    } catch (error) {
      console.error('❌ PaymentTab: Error loading payment methods:', error);
      setPaymentMethods([]);
    } finally {
      console.log('🔄 PaymentTab: Setting loading to false');
      setLoading(false);
    }
  };

  const startEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setEditForm({
      name: method.name,
      description: method.description,
      payment_type: method.payment_type,
      is_active: method.is_active,
      sort_order: method.sort_order,
      bank_name: method.bank_name || '',
      account_number: method.account_number || '',
      account_holder: method.account_holder || '',
      qris_image_url: method.qris_image_url || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      name: '',
      description: '',
      payment_type: 'TRANSFER',
      is_active: true,
      sort_order: 0,
      bank_name: '',
      account_number: '',
      account_holder: '',
      qris_image_url: ''
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const updateData: any = {
        name: editForm.name,
        description: editForm.description,
        payment_type: editForm.payment_type,
        is_active: editForm.is_active,
        sort_order: editForm.sort_order
      };

      // Add payment type specific fields
      if (editForm.payment_type === 'TRANSFER') {
        updateData.bank_name = editForm.bank_name;
        updateData.account_number = editForm.account_number;
        updateData.account_holder = editForm.account_holder;
      } else if (editForm.payment_type === 'QRIS') {
        updateData.qris_image_url = editForm.qris_image_url;
      }

      const { error } = await (supabase as any)
        .from('payment_methods')
        .update(updateData)
        .eq('id', editingId);

      if (error) throw error;

      await loadPaymentMethods();
      cancelEdit();
    } catch (error) {
      console.error('Error updating payment method:', error);
      alert('Gagal memperbarui metode pembayaran');
    }
  };

  const addNewMethod = async () => {
    const newMethod: any = {
      name: 'Metode Baru',
      description: 'Deskripsi metode pembayaran',
      payment_type: 'TRANSFER',
      is_active: true,
      sort_order: paymentMethods.length
    };

    try {
      const { error } = await (supabase as any)
        .from('payment_methods')
        .insert(newMethod);

      if (error) throw error;

      await loadPaymentMethods();
    } catch (error) {
      console.error('Error adding payment method:', error);
      alert('Gagal menambah metode pembayaran');
    }
  };

  const deleteMethod = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      itemId: id,
      itemName: name
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.itemId) return;

    try {
      const { error } = await (supabase as any)
        .from('payment_methods')
        .delete()
        .eq('id', deleteConfirm.itemId);

      if (error) throw error;

      await loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Gagal menghapus metode pembayaran');
    } finally {
      setDeleteConfirm({ isOpen: false, itemId: null, itemName: '' });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('payment_methods')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      await loadPaymentMethods();
    } catch (error) {
      console.error('Error toggling payment method:', error);
      alert('Gagal mengubah status metode pembayaran');
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
        <h2 className="text-lg font-semibold text-slate-900">Kelola Metode Pembayaran</h2>
        <button
          onClick={addNewMethod}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Metode</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {paymentMethods.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Belum ada metode pembayaran</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {paymentMethods.map((method) => (
              <div key={method.id} className="p-6">
                {editingId === method.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Metode</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Pembayaran</label>
                        <select
                          value={editForm.payment_type}
                          onChange={(e) => setEditForm({ ...editForm, payment_type: e.target.value as 'TRANSFER' | 'QRIS' | 'COD' })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="TRANSFER">Transfer Bank</option>
                          <option value="QRIS">QRIS</option>
                          <option value="COD">Cash on Delivery</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    {/* Bank Transfer Fields */}
                    {editForm.payment_type === 'TRANSFER' && (
                      <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-900">Detail Transfer Bank</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bank</label>
                            <input
                              type="text"
                              value={editForm.bank_name}
                              onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })}
                              placeholder="BCA, BNI, Mandiri, dll"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Rekening</label>
                            <input
                              type="text"
                              value={editForm.account_number}
                              onChange={(e) => setEditForm({ ...editForm, account_number: e.target.value })}
                              placeholder="1234567890"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pemilik Rekening</label>
                          <input
                            type="text"
                            value={editForm.account_holder}
                            onChange={(e) => setEditForm({ ...editForm, account_holder: e.target.value })}
                            placeholder="Nama lengkap pemilik rekening"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* QRIS Fields */}
                    {editForm.payment_type === 'QRIS' && (
                      <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-900">QRIS</h4>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">URL Gambar QRIS</label>
                          <input
                            type="url"
                            value={editForm.qris_image_url}
                            onChange={(e) => setEditForm({ ...editForm, qris_image_url: e.target.value })}
                            placeholder="https://example.com/qris-image.jpg"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Masukkan URL gambar QRIS yang akan ditampilkan ke pelanggan
                          </p>
                        </div>
                        {editForm.qris_image_url && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Preview QRIS</label>
                            <div className="border border-slate-300 rounded-lg p-4 bg-white">
                              <img
                                src={editForm.qris_image_url}
                                alt="QRIS Preview"
                                className="max-w-xs mx-auto"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`active-${method.id}`}
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                        className="rounded border-slate-300 text-green-500 focus:ring-green-500"
                      />
                      <label htmlFor={`active-${method.id}`} className="text-sm text-slate-700">
                        Aktif
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <Save className="w-4 h-4" />
                        Simpan
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                      >
                        <X className="w-4 h-4" />
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-slate-900">{method.name}</h3>
                        <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">
                          {method.payment_type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          method.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {method.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{method.description}</p>

                      {/* Bank Details Display */}
                      {method.payment_type === 'TRANSFER' && (method.bank_name || method.account_number || method.account_holder) && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                          <h5 className="text-sm font-medium text-blue-900 mb-2">Detail Rekening:</h5>
                          <div className="space-y-1 text-sm text-blue-800">
                            {method.bank_name && <p><strong>Bank:</strong> {method.bank_name}</p>}
                            {method.account_number && <p><strong>No. Rekening:</strong> {method.account_number}</p>}
                            {method.account_holder && <p><strong>Pemilik:</strong> {method.account_holder}</p>}
                          </div>
                        </div>
                      )}

                      {/* QRIS Display */}
                      {method.payment_type === 'QRIS' && method.qris_image_url && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-slate-700 mb-2">QRIS:</h5>
                          <div className="border border-slate-300 rounded-lg p-3 bg-white inline-block">
                            <img
                              src={method.qris_image_url}
                              alt="QRIS Code"
                              className="w-32 h-32 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5YTNhZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-slate-500">Urutan: {method.sort_order}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(method.id, method.is_active)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          method.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {method.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => startEdit(method)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMethod(method.id, method.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, itemId: null, itemName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Hapus Metode Pembayaran"
        message={`Apakah Anda yakin ingin menghapus metode pembayaran "${deleteConfirm.itemName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
