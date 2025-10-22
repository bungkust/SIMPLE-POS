import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormSelect, SelectItem } from '@/components/forms/FormSelect';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CheckCircle,
  Receipt,
  Package
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useIsMobile } from '@/hooks/use-media-query';
import { formatCurrency, normalizePhone } from '@/lib/form-utils';
import { generateOrderCode } from '@/lib/orderUtils';
import { cashierOrderSchema, type CashierOrderData } from '@/lib/form-schemas';
import { useAppToast } from '@/components/ui/toast-provider';
import { Database } from '../../lib/database.types';
import { sendOrderNotification } from '@/lib/telegram-utils';
import { getActiveSubscribers } from '@/lib/telegram-webhook';

import { logger } from '@/lib/logger';
import { colors, typography, components, sizes, spacing, cn } from '@/lib/design-system';
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
  const { config } = useConfig();
  const { showSuccess, showError } = useAppToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CashierOrderData>({
    resolver: zodResolver(cashierOrderSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      notes: '',
      payment_method: 'QRIS'
    }
  });


  useEffect(() => {
    loadData();
  }, [currentTenant]);

  const loadData = async () => {
    if (!currentTenant?.id) return;

    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (menuError) throw menuError;
      setMenuItems(menuData || []);

      // Load payment methods
      const { data: paymentMethodsData, error: paymentError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (paymentError) {
        logger.error('Error loading payment methods:', paymentError);
        // Fallback to default methods if database query fails
        setAvailablePaymentMethods(['QRIS', 'COD', 'TRANSFER']);
      } else {
        const methods = paymentMethodsData?.map(method => method.payment_type) || [];
        setAvailablePaymentMethods(methods);
        logger.log('✅ Payment methods loaded:', methods);
      }

    } catch (error) {
      logger.error('Error loading data:', error);
      showError('Error', 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === selectedCategory);

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.menu_item_id === item.id);
    
    if (existingItem) {
      setCart(prev => prev.map(cartItem =>
        cartItem.menu_item_id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      const newCartItem: CartItem = {
        id: `${item.id}-${Date.now()}`,
        menu_item_id: item.id,
        name: item.name,
        price: item.price || 0,
        quantity: 1,
        notes: ''
      };
      setCart(prev => [...prev, newCartItem]);
    }
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    
    setCart(prev => prev.map(item =>
      item.id === cartItemId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    reset();
    setValue('payment_method', 'QRIS'); // Ensure QRIS is selected
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const onSubmit = async (data: CashierOrderData) => {
    if (cart.length === 0) {
      showError('Empty Cart', 'Please add items to cart before placing order');
      return;
    }

    // Validate payment method
    if (!data.payment_method || data.payment_method.trim() === '') {
      showError('Validation Error', 'Silakan pilih metode pembayaran terlebih dahulu.');
      return;
    }

    // Validate payment method value
    if (!['TRANSFER', 'QRIS', 'COD'].includes(data.payment_method)) {
      showError('Validation Error', 'Metode pembayaran tidak valid.');
      return;
    }

    // Check if selected payment method is available
    if (!availablePaymentMethods.includes(data.payment_method)) {
      showError('Validation Error', 'Metode pembayaran yang dipilih tidak tersedia.');
      return;
    }

    logger.log('✅ Payment method validation passed:', data.payment_method);

    setProcessingOrder(true);
    try {
      // Generate order code
      const orderCode = generateOrderCode();

      // Create order
      const subtotal = getTotalAmount();
      const discount = 0;
      const serviceFee = 0;
      const total = subtotal - discount + serviceFee;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: currentTenant.id,
          order_code: orderCode,
          customer_name: data.customer_name || 'Customer',
          phone: data.customer_phone ? normalizePhone(data.customer_phone) : 'Tidak ada',
          pickup_date: new Date().toISOString().split('T')[0], // Today's date
          subtotal,
          discount,
          service_fee: serviceFee,
          total,
          payment_method: data.payment_method,
          status: 'PENDING',
          notes: data.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_id: item.menu_item_id,
        name_snapshot: item.name,
        price_snapshot: item.price,
        qty: item.quantity,
        notes: item.notes || null,
        line_total: item.price * item.quantity,
        tenant_id: currentTenant.id,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send Telegram notification if enabled
      if (config.telegramBotToken && config.telegramNotifyCashier) {
        try {
          const chatIds = await getActiveSubscribers(currentTenant.id);
          
          if (chatIds.length > 0) {
            await sendOrderNotification(
              { 
                botToken: config.telegramBotToken,
                chatIds: chatIds
              },
              orderData as any,
              {
                name: currentTenant.name,
                slug: currentTenant.slug,
                phone: undefined, // Not available in currentTenant
                address: undefined, // Not available in currentTenant
              },
              'cashier'
            );
            console.log('✅ Telegram notification sent for cashier order');
          }
        } catch (error) {
          // Log error but don't block order creation
          console.error('❌ Telegram notification failed:', error);
        }
      }

      // Clear cart and reset form
      clearCart();
      setShowCustomerForm(false);

      showSuccess('Order Created', `Order ${orderCode} has been created successfully!`);
      
      // Redirect to order success page
             setTimeout(() => {
               navigate(`/${currentTenant?.slug}/success/${orderCode}`, { 
                 state: { fromAdmin: true } 
               });
             }, 1500);
    } catch (error: any) {
      logger.error('Error creating order:', error);
      
      // More specific error handling
      if (error.message?.includes('payment_method')) {
        showError('Payment Error', 'Metode pembayaran tidak valid. Silakan pilih metode pembayaran yang tersedia.');
      } else if (error.message?.includes('tenant_id')) {
        showError('Tenant Error', 'Terjadi kesalahan dengan tenant. Silakan refresh halaman.');
      } else if (error.message?.includes('menu_id')) {
        showError('Menu Error', 'Terjadi kesalahan dengan menu item. Silakan coba lagi.');
      } else {
        showError('Order Failed', 'Gagal membuat pesanan: ' + (error.message || 'Terjadi kesalahan tidak diketahui'));
      }
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className={cn(spacing.lg)}>
        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6")}>
          <div className="lg:col-span-2">
            <Card className={cn(components.card)}>
              <CardContent className={cn(sizes.card.lg)}>
                <div className="animate-pulse">
                  <div className={cn("h-4 bg-gray-200 rounded w-1/4 mb-4")}></div>
                  <div className={cn(`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`)}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className={cn("h-32 bg-gray-200 rounded")}></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className={cn(components.card)}>
              <CardContent className={cn(sizes.card.lg)}>
                <div className="animate-pulse">
                  <div className={cn("h-4 bg-gray-200 rounded w-1/2 mb-4")}></div>
                  <div className={cn(spacing.sm)}>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={cn("h-16 bg-gray-200 rounded")}></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(spacing.md, "w-full max-w-full overflow-hidden")}>
      <div className={cn(`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`)}>
        {/* Menu Items */}
        <div className={cn(`space-y-4 ${isMobile ? 'order-1' : 'lg:col-span-2'}`)}>
          {/* Category Filter */}
          <Card className={cn(components.card, "w-full max-w-full overflow-hidden")}>
            <CardHeader>
              <div className={cn(spacing.md)}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className={cn(typography.h3, "flex items-center gap-2")}>
                      <Package className={cn(sizes.icon.md)} />
                      Daftar Menu
                    </CardTitle>
                    <CardDescription className={cn(typography.body.medium, colors.text.secondary)}>
                      Kelola kasir dan transaksi
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-hidden w-full max-w-full">
              <div className={cn("flex flex-wrap gap-2 mb-4")}>
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className={cn(selectedCategory === 'all' ? components.buttonPrimary : components.buttonOutline)}
                >
                  Semua Item
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(selectedCategory === category.id ? components.buttonPrimary : components.buttonOutline)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>

              <div className={cn(`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`)}>
                {filteredMenuItems.map((item) => (
                  <Card key={item.id} className={cn(components.card, "hover:shadow-md transition-shadow cursor-pointer")}>
                    <CardContent className={cn(sizes.card.md)}>
                      <div className={cn(spacing.sm)}>
                        <h4 className={cn(typography.label.medium)}>{item.name}</h4>
                        <p className={cn(typography.body.small, colors.text.muted, "line-clamp-2")}>
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={cn(typography.price.small)}>
                            {formatCurrency(item.price || 0)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => addToCart(item)}
                            className={cn("h-8 w-8 p-0", components.buttonPrimary)}
                          >
                            <Plus className={cn(sizes.icon.sm)} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredMenuItems.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tidak Ada Item</h3>
                  <p className="text-muted-foreground">
                    {selectedCategory === 'all' 
                      ? 'Tidak ada menu yang tersedia' 
                      : 'Tidak ada item dalam kategori ini'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <div className={cn(`space-y-4 ${isMobile ? 'order-2' : ''}`)}>
          <Card className={cn(components.card, "w-full max-w-full overflow-hidden")}>
            <CardHeader>
              <div className={cn(spacing.md)}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className={cn(typography.h3, "flex items-center gap-2")}>
                      <ShoppingCart className={cn(sizes.icon.md)} />
                      Keranjang
                    </CardTitle>
                    <CardDescription className={cn(typography.body.medium, colors.text.secondary)}>
                      Review pesanan sebelum checkout
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {getTotalItems()} item
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-hidden w-full max-w-full">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className={cn(sizes.icon.lg, colors.text.muted, "mx-auto mb-4")} />
                  <h3 className={cn(typography.h3, "mb-2")}>Keranjang Kosong</h3>
                  <p className={cn(typography.body.medium, colors.text.muted)}>
                    Tambahkan item dari menu untuk memulai
                  </p>
                </div>
              ) : (
                <div className={cn(spacing.md)}>
                  <div className={cn("space-y-2 max-h-64 overflow-y-auto")}>
                    {cart.map((item) => (
                      <div key={item.id} className={cn("flex items-center justify-between p-2 border rounded-lg")}>
                        <div className="flex-1 min-w-0">
                          <h5 className={cn(typography.label.medium, "truncate")}>{item.name}</h5>
                          <p className={cn(typography.body.small, colors.text.muted)}>
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className={cn("h-6 w-6 p-0", components.buttonOutline)}
                          >
                            <Minus className={cn(sizes.icon.sm)} />
                          </Button>
                          <span className={cn(typography.body.small, "font-medium w-6 text-center")}>
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className={cn("h-6 w-6 p-0", components.buttonOutline)}
                          >
                            <Plus className={cn(sizes.icon.sm)} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className={cn("h-6 w-6 p-0 text-destructive hover:text-destructive")}
                          >
                            <Trash2 className={cn(sizes.icon.sm)} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className={cn(spacing.sm)}>
                    <div className={cn("flex justify-between", typography.body.small)}>
                      <span>Subtotal:</span>
                      <span>{formatCurrency(getTotalAmount())}</span>
                    </div>
                    <div className={cn("flex justify-between", typography.label.medium)}>
                      <span>Total:</span>
                      <span>{formatCurrency(getTotalAmount())}</span>
                    </div>
                  </div>

                  <div className={cn(spacing.sm)}>
                    <Button
                      onClick={() => {
                        setShowCustomerForm(true);
                        setValue('payment_method', 'QRIS'); // Ensure QRIS is selected when opening dialog
                      }}
                      className={cn("w-full", components.buttonPrimary)}
                      disabled={cart.length === 0}
                    >
                      <Receipt className={cn(sizes.icon.sm, "mr-2")} />
                      Proses Pesanan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearCart}
                      className={cn("w-full", components.buttonOutline)}
                      disabled={cart.length === 0}
                    >
                      <Trash2 className={cn(sizes.icon.sm, "mr-2")} />
                      Kosongkan Keranjang
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer Form Dialog */}
      <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
        <DialogContent className={`${isMobile ? 'w-full h-full max-w-full max-h-full' : 'max-w-2xl'}`}>
          <DialogHeader>
            <DialogTitle className={cn(typography.h3)}>Informasi Pesanan</DialogTitle>
            <DialogDescription className={cn(typography.body.medium, colors.text.secondary)}>
              Masukkan detail pelanggan (opsional) dan pilih metode pembayaran
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className={cn(`space-y-4 ${isMobile ? 'space-y-6' : ''}`)}>
            <FormInput
              {...register('customer_name')}
              label="Nama Pelanggan (Opsional)"
              placeholder="Masukkan nama pelanggan atau kosongkan"
              error={errors.customer_name?.message}
              disabled={processingOrder}
              className={isMobile ? 'w-full' : ''}
            />

            <FormInput
              {...register('customer_phone')}
              label="Nomor Telepon (Opsional)"
              placeholder="Masukkan nomor telepon"
              error={errors.customer_phone?.message}
              disabled={processingOrder}
              className={isMobile ? 'w-full' : ''}
            />

            <FormTextarea
              {...register('notes')}
              label="Catatan Pesanan (Opsional)"
              placeholder="Instruksi khusus atau catatan..."
              error={errors.notes?.message}
              disabled={processingOrder}
              rows={3}
              className={isMobile ? 'w-full' : ''}
            />

            <FormSelect
              {...register('payment_method')}
              label="Metode Pembayaran"
              error={errors.payment_method?.message}
              required
              disabled={processingOrder}
              defaultValue="QRIS"
              className={isMobile ? 'w-full' : ''}
            >
              <SelectItem value="QRIS">QRIS (Default)</SelectItem>
              <SelectItem value="COD">Tunai</SelectItem>
              <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
            </FormSelect>

            <div className={cn(`flex space-x-2 ${isMobile ? 'flex-col space-y-2' : 'justify-end'}`)}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomerForm(false)}
                disabled={processingOrder}
                className={cn(isMobile ? 'w-full' : '', components.buttonOutline)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={processingOrder}
                className={cn(isMobile ? 'w-full' : '', components.buttonPrimary)}
              >
                {processingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses Pesanan...
                  </>
                ) : (
                  <>
                    <CheckCircle className={cn(sizes.icon.sm, "mr-2")} />
                    Buat Pesanan
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
