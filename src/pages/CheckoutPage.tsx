import { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatRupiah, normalizePhone, getTomorrowDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { generateOrderCode } from '../lib/orderUtils';
import { ErrorModal } from '../components/ErrorModal';

interface CheckoutPageProps {
  onBack: () => void;
  onSuccess: (orderCode: string) => void;
}

export function CheckoutPage({ onBack, onSuccess }: CheckoutPageProps) {
  const { items, totalAmount, removeItem, clearCart } = useCart();
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: '',
    details: '',
    onRetry: null as (() => void) | null
  });
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    pickupDate: getTomorrowDate(),
    notes: '',
    paymentMethod: 'TRANSFER' as 'TRANSFER' | 'QRIS' | 'COD',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedPhone = normalizePhone(formData.phone);

      const subtotal = totalAmount;
      const discount = 0;
      const serviceFee = 0;
      const total = subtotal - discount + serviceFee;

      // Ensure we have a valid tenant_id - fallback to default Kopi Pendekar tenant if needed
      const tenantId = currentTenant?.tenant_id || 'd9c9a0f5-72d4-4ee2-aba9-6bf89f43d230';

      if (process.env.NODE_ENV === 'development') {
        console.log('Creating order with tenant_id:', tenantId);
        console.log('Current tenant object:', currentTenant);
      }

      const orderData = {
        tenant_id: tenantId, // ✅ Add tenant_id to fix the null constraint issue
        order_code: generateOrderCode(),
        customer_name: formData.customerName,
        phone: normalizedPhone,
        pickup_date: formData.pickupDate,
        notes: formData.notes || null,
        payment_method: formData.paymentMethod,
        status: 'BELUM BAYAR' as const,
        subtotal,
        discount,
        service_fee: serviceFee,
        total,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Failed to create order');

      const orderItems = items.map((item) => ({
        tenant_id: tenantId, // ✅ Add tenant_id to order items too
        order_id: order.id,
        menu_id: item.id,
        name_snapshot: item.name,
        price_snapshot: item.price,
        qty: item.qty,
        notes: item.notes || null,
        line_total: item.price * item.qty,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
      if (webhookUrl && webhookUrl.includes('script.google.com')) {
        try {
          const itemsJoin = items
            .map((item) => `${item.name} x${item.qty}`)
            .join('; ');

          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_code: order.order_code,
              customer_name: formData.customerName,
              phone: normalizedPhone,
              pickup_date: formData.pickupDate,
              items_join: itemsJoin,
              subtotal,
              discount,
              service_fee: serviceFee,
              total,
              payment_method: formData.paymentMethod,
              status: 'BELUM BAYAR',
              notes: formData.notes || '',
            }),
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to send to Google Sheets:', error);
          }
        }
      }

      clearCart();
      onSuccess(order.order_code);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating order:', error);
      }

      // Show error modal instead of alert
      setErrorModal({
        isOpen: true,
        message: 'Gagal membuat pesanan',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        onRetry: () => {
          setErrorModal({ isOpen: false, message: '', details: '', onRetry: null });
          // Re-submit the form
          handleSubmit(new Event('submit') as any);
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Checkout</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="font-semibold text-slate-900 mb-3">Ringkasan Pesanan</h2>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex gap-3">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  {item.notes && (
                    <p className="text-sm text-slate-500">Catatan: {item.notes}</p>
                  )}
                  <p className="text-sm text-slate-600">
                    {item.qty} x {formatRupiah(item.price)}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <p className="font-semibold text-slate-900">
                    {formatRupiah(item.price * item.qty)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-bold text-green-600 text-xl">
                {formatRupiah(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Informasi Pemesan</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nama Anda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                No. HP / WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tanggal Ambil / Antar <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={getTomorrowDate()}
                value={formData.pickupDate}
                onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Catatan Pesanan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
                placeholder="Contoh: Antarkan ke kantor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['TRANSFER', 'QRIS', 'COD'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.paymentMethod === method
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Buat Pesanan'}
          </button>
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
        showTechnicalDetails={false}
      />
    </div>
  );
}