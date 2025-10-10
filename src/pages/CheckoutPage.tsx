import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatRupiah, normalizePhone, getTomorrowDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { generateOrderCode } from '../lib/orderUtils';
import { ErrorModal } from '../components/ErrorModal';
import { getTenantInfo, getTenantId } from '../lib/tenantUtils';

interface CheckoutPageProps {
  onBack: () => void;
  onSuccess: (orderCode: string) => void;
}

export function CheckoutPage({ onBack, onSuccess }: CheckoutPageProps) {
  const { items, totalAmount, removeItem, clearCart } = useCart();
  
  // Get tenant info - use currentTenant if available (authenticated), otherwise use URL
  const getTenantInfoLocal = () => {
    try {
      const { currentTenant } = useAuth();
      if (currentTenant) {
        return currentTenant;
      }
    } catch (error) {
      // AuthContext not available, use URL fallback
    }
    
    // Fallback: get tenant slug from URL
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(Boolean);
    
    if (pathParts.length >= 1 && !pathParts[0].includes('admin') && !pathParts[0].includes('login') && pathParts[0] !== 'checkout' && pathParts[0] !== 'orders' && pathParts[0] !== 'invoice' && pathParts[0] !== 'success' && pathParts[0] !== 'auth') {
      return {
        tenant_slug: pathParts[0],
        tenant_id: null,
        tenant_name: pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1).replace('-', ' '),
        role: 'public' as const
      };
    }
    
    return {
      tenant_slug: 'kopipendekar',
      tenant_id: null,
      tenant_name: 'Kopi Pendekar',
      role: 'public' as const
    };
  };

  const currentTenant = getTenantInfoLocal();
  const [loading, setLoading] = useState(false);
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>(['TRANSFER', 'COD']);
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

  // Resolve tenant ID once when component mounts
  useEffect(() => {
    const resolveTenantId = async () => {
      if (currentTenant.tenant_id) {
        setResolvedTenantId(currentTenant.tenant_id);
      } else if (currentTenant.tenant_slug) {
        const tenantId = await getTenantId(currentTenant.tenant_slug);
        setResolvedTenantId(tenantId);
      }
    };
    
    resolveTenantId();
  }, [currentTenant.tenant_slug, currentTenant.tenant_id]);

  // Load available payment methods when tenant ID is resolved
  useEffect(() => {
    if (resolvedTenantId) {
      loadAvailablePaymentMethods();
    }
  }, [resolvedTenantId]);

  const loadAvailablePaymentMethods = async () => {
    if (!resolvedTenantId) return;

    try {

      const { data: paymentMethods, error } = await supabase
        .from('payment_methods')
        .select('payment_type, is_active')
        .eq('tenant_id', resolvedTenantId)
        .eq('is_active', true);

      if (error) {
        console.warn('Error loading payment methods:', error);
        return;
      }

      const availableMethods = ['TRANSFER', 'COD']; // Always available as fallback

      // Add QRIS if there's an active QRIS payment method
      if (paymentMethods?.some(pm => pm.payment_type === 'QRIS')) {
        availableMethods.push('QRIS');
      }

      setAvailablePaymentMethods(availableMethods);

      // If current selected method is not available, switch to first available
      if (!availableMethods.includes(formData.paymentMethod)) {
        setFormData(prev => ({ ...prev, paymentMethod: availableMethods[0] as 'TRANSFER' | 'QRIS' | 'COD' }));
      }
    } catch (error) {
      console.warn('Error loading payment methods:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedPhone = normalizePhone(formData.phone);

      const subtotal = totalAmount;
      const discount = 0;
      const serviceFee = 0;
      const total = subtotal - discount + serviceFee;

      // Use resolved tenant ID
      const tenantId = resolvedTenantId;
      if (!tenantId) {
        throw new Error('Could not resolve tenant ID for order creation');
      }

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
                {(['TRANSFER', 'QRIS', 'COD'] as const).map((method) => {
                  const isAvailable = availablePaymentMethods.includes(method);
                  return (
                    <button
                      key={method}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && setFormData({ ...formData, paymentMethod: method })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.paymentMethod === method
                          ? 'bg-green-500 text-white'
                          : isAvailable
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {method}
                    </button>
                  );
                })}
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