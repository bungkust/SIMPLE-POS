import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, DollarSign, QrCode } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatRupiah } from '../../lib/utils';
import { Database } from '../../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type CartItem = {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
};

export function CashierTab() {
  const { currentTenant } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    notes: ''
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'QRIS' | 'COD' | null>(null);
  const [showPaymentMethodSelection, setShowPaymentMethodSelection] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadData();
  }, [currentTenant]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' });
      }, 4000); // Hide after 4 seconds

      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const loadData = async () => {
    if (!currentTenant?.tenant_id) return;

    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*')
          .eq('tenant_id', currentTenant.tenant_id)
          .eq('is_active', true)
          .order('created_at'),
        supabase
          .from('categories')
          .select('*')
          .eq('tenant_id', currentTenant.tenant_id)
          .order('sort_order')
      ]);

      if (itemsRes.data) setMenuItems(itemsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading cashier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.menu_item_id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.menu_item_id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, {
        id: Date.now().toString(),
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const processOrder = async () => {
    if (cart.length === 0 || !paymentMethod) {
      setNotification({
        show: true,
        message: 'Keranjang kosong atau metode pembayaran belum dipilih',
        type: 'error'
      });
      return;
    }

    // Ensure we have a valid tenant_id - fallback to default Kopi Pendekar tenant if needed
    const tenantId = currentTenant?.tenant_id || 'd9c9a0f5-72d4-4ee2-aba9-6bf89f43d230';

    if (process.env.NODE_ENV === 'development') {
      console.log('Creating order with tenant_id:', tenantId);
      console.log('Current tenant object:', currentTenant);
    }

    try {
      // Generate order code
      const orderCode = `KP-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: tenantId, // ✅ Use validated/fallback tenant_id
          order_code: orderCode,
          customer_name: customerInfo.name || 'Customer',
          phone: customerInfo.phone || '',
          pickup_date: new Date().toISOString().split('T')[0],
          notes: customerInfo.notes || '',
          subtotal: getTotal(),
          total: getTotal(),
          status: 'SUDAH BAYAR', // Set to paid since this is a direct cashier transaction
          payment_method: paymentMethod // ✅ Now properly setting the selected payment method
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(cartItem => ({
        tenant_id: tenantId, // ✅ Use the same validated/fallback tenant_id
        order_id: orderData.id,
        menu_id: cartItem.menu_item_id,
        name_snapshot: cartItem.name,
        price_snapshot: cartItem.price,
        qty: cartItem.quantity,
        line_total: cartItem.price * cartItem.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Reset form
      setCart([]);
      setCustomerInfo({ name: '', phone: '', notes: '' });
      setShowCustomerForm(false);
      setShowPaymentModal(false);
      setShowPaymentMethodSelection(false);
      setPaymentMethod(null);

      // Show success message based on payment method
      const paymentMethodText = paymentMethod === 'TRANSFER' ? 'transfer' : paymentMethod === 'QRIS' ? 'QRIS' : 'COD';
      setNotification({
        show: true,
        message: `Pesanan berhasil dibuat dengan pembayaran ${paymentMethodText}!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating order:', error);
      setNotification({
        show: true,
        message: 'Gagal membuat pesanan',
        type: 'error'
      });
    }
  };

  const filteredMenuItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category_id === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Items */}
      <div className="lg:col-span-2 space-y-4">
        {/* Categories */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu List */}
        <div className="space-y-3">
          {filteredMenuItems.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
              <div className="flex">
                <div className="w-20 h-20 relative bg-slate-100 flex-shrink-0">
                  {item.photo_url ? (
                    <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-slate-400 text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      {item.short_description && (
                        <p className="text-sm text-slate-600 mt-1">{item.short_description}</p>
                      )}
                    </div>
                    <span className="font-bold text-green-600 text-lg">{formatRupiah(item.price)}</span>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Tambah</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar - Column Layout */}
      <div className="flex flex-col h-full">
        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Info Customer</h3>
            <button
              onClick={() => setShowCustomerForm(!showCustomerForm)}
              className="text-sm text-green-600 hover:text-green-700"
            >
              {showCustomerForm ? 'Sembunyikan' : 'Edit'}
            </button>
          </div>

          {showCustomerForm ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nama customer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">No. HP</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nomor HP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                <textarea
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={2}
                  placeholder="Catatan tambahan"
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              {customerInfo.name || 'Nama belum diisi'}
            </div>
          )}
        </div>

        {/* Cart and Total Container - No gap between them */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Cart Items - Fills remaining height */}
          <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-sm">
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Keranjang ({cart.length})</h3>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-slate-500 text-sm text-center">Keranjang kosong</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-3 pr-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 text-sm">{item.name}</h4>
                          <p className="text-green-600 font-semibold">{formatRupiah(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Total - Sticks to bottom, no gap */}
          {cart.length > 0 && (
            <div className="flex-shrink-0 bg-white rounded-xl shadow-sm p-4 border-t-4 border-green-500">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{formatRupiah(getTotal())}</span>
                </div>

                <button
                  onClick={() => {
                    setShowPaymentMethodSelection(true);
                    setShowPaymentModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                >
                  <CreditCard className="w-5 h-5" />
                  Bayar Sekarang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {showPaymentMethodSelection ? 'Pilih Metode Pembayaran' : 'Konfirmasi Pesanan'}
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowPaymentMethodSelection(false);
                  setPaymentMethod(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {showPaymentMethodSelection ? (
                /* Payment Method Selection */
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Pilih metode pembayaran:</h4>
                    <p className="text-sm text-slate-600 mb-4">Total: <span className="font-bold text-green-600">{formatRupiah(getTotal())}</span></p>

                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setPaymentMethod('TRANSFER');
                          setShowPaymentMethodSelection(false);
                        }}
                        className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-slate-900">Transfer / Tunai</div>
                          <div className="text-sm text-slate-600">Pembayaran dengan transfer bank atau tunai</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setPaymentMethod('QRIS');
                          setShowPaymentMethodSelection(false);
                        }}
                        className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-slate-900">QRIS</div>
                          <div className="text-sm text-slate-600">Pembayaran digital dengan QR code</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Order Confirmation */
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Ringkasan Pesanan</h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Pembayaran: <span className="font-semibold text-green-600">
                        {paymentMethod === 'TRANSFER' ? 'Transfer/Tunai' : paymentMethod === 'QRIS' ? 'QRIS' : 'COD'}
                      </span>
                    </p>
                    <p className="text-sm text-slate-600 mb-3">Pesanan akan langsung ditandai sebagai <span className="font-semibold text-green-600">SUDAH BAYAR</span></p>
                    <div className="space-y-2">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span>{formatRupiah(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-green-600">{formatRupiah(getTotal())}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        setPaymentMethod(null);
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={processOrder}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Konfirmasi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`p-4 rounded-lg shadow-lg border-l-4 ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-800'
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-3 ${
                notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
