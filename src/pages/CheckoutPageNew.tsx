import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { FormRadioGroup } from '@/components/forms/FormRadioGroup';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ShoppingCart, CreditCard, Smartphone, Banknote, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppToast } from '@/components/ui/toast-provider';
import { checkoutFormSchema, type CheckoutFormData } from '@/lib/form-schemas';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, normalizePhone, generateOrderCode, getTomorrowDate } from '@/lib/form-utils';
import { getTenantInfo } from '@/lib/tenantUtils';

interface CheckoutPageProps {
  onBack: () => void;
  onSuccess: (orderCode: string) => void;
}

export function CheckoutPage({ onBack, onSuccess }: CheckoutPageProps) {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const { showError, showSuccess } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>(['TRANSFER', 'COD']);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      pickupDate: getTomorrowDate(),
      notes: '',
      paymentMethod: 'TRANSFER'
    }
  });

  const paymentMethod = watch('paymentMethod');

  // Resolve tenant ID once when component mounts
  useEffect(() => {
    const resolveTenantId = async () => {
      try {
        const resolvedTenantInfo = await getTenantInfo();
        if (resolvedTenantInfo) {
          setTenantInfo(resolvedTenantInfo);
          setResolvedTenantId(resolvedTenantInfo.tenant_id);
        } else {
          showError('Error', 'Failed to resolve tenant information.');
        }
      } catch (error) {
        console.error('Error in resolveTenantId:', error);
        showError('Error', 'Failed to resolve tenant information.');
      }
    };

    resolveTenantId();
  }, [showError]);

  const loadAvailablePaymentMethods = async () => {
    try {
      if (!resolvedTenantId) return;

      // Try to get payment methods from payment_methods table
      const { data: paymentMethods, error } = await supabase
        .from('payment_methods')
        .select('payment_type, is_active')
        .eq('tenant_id', resolvedTenantId)
        .eq('is_active', true);

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading payment methods:', error);
        // Default payment methods on error
        setAvailablePaymentMethods(['TRANSFER', 'COD']);
        return;
      }

      if (paymentMethods && paymentMethods.length > 0) {
        const methods = paymentMethods.map(method => method.payment_type);
        setAvailablePaymentMethods(methods);
      } else {
        // Default payment methods if no settings found
        setAvailablePaymentMethods(['TRANSFER', 'COD']);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  useEffect(() => {
    loadAvailablePaymentMethods();
  }, [resolvedTenantId]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (!resolvedTenantId) {
      showError('Error', 'Could not resolve tenant ID for order creation');
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(data.phone);
      const subtotal = totalAmount;
      const discount = 0;
      const serviceFee = 0;
      const total = subtotal - discount + serviceFee;

      const orderData = {
        tenant_id: resolvedTenantId,
        order_code: generateOrderCode(),
        customer_name: data.customerName,
        phone: normalizedPhone,
        pickup_date: data.pickupDate,
        notes: data.notes || null,
        payment_method: data.paymentMethod,
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

      const orderItems = items.map((item) => {
        // Ensure we have a valid UUID for menu_id
        let menuId = item.menu_id || item.id;
        
        // If the ID contains JSON (complex ID), extract the original menu ID
        if (menuId.includes('-{') && menuId.includes('}')) {
          menuId = menuId.split('-{')[0];
        }
        
        // Parse and structure the options properly
        let structuredNotes = null;
        if (item.notes) {
          try {
            // Check if notes contain structured options
            if (item.notes.includes('{') && item.notes.includes('}')) {
              // JSON format from MenuDetailSheet - keep as is for now
              structuredNotes = item.notes;
            } else if (item.notes.includes(':')) {
              // Formatted text from MenuDetailModal - structure it
              const optionsText = item.notes;
              structuredNotes = `OPTIONS:${optionsText}`;
            } else {
              // Plain user notes
              structuredNotes = `USER_NOTES:${item.notes}`;
            }
          } catch (error) {
            // Fallback to plain text
            structuredNotes = item.notes;
          }
        }
        
        return {
          tenant_id: resolvedTenantId,
          order_id: order.id,
          menu_id: menuId,
          name_snapshot: item.name,
          price_snapshot: item.price,
          qty: item.qty,
          notes: structuredNotes,
          line_total: item.price * item.qty,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart and show success
      clearCart();
      showSuccess('Order Created!', `Your order ${order.order_code} has been created successfully.`);
      onSuccess(order.order_code);

    } catch (error: any) {
      console.error('Checkout error:', error);
      showError('Checkout Failed', error.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethodOptions = [
    { value: 'TRANSFER', label: 'Bank Transfer', disabled: !availablePaymentMethods.includes('TRANSFER') },
    { value: 'QRIS', label: 'QRIS Payment', disabled: !availablePaymentMethods.includes('QRIS') },
    { value: 'COD', label: 'Cash on Delivery', disabled: !availablePaymentMethods.includes('COD') },
  ].filter(option => !option.disabled);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground h-8 px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Menu</span>
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Checkout</h1>
              <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Complete your order</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-2 sm:p-4 pb-40 sm:pb-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-2 sm:pb-3">
                <CardTitle className="flex items-center text-sm sm:text-lg">
                  <ShoppingCart className="h-3 w-3 sm:h-5 sm:w-5 mr-2" />
                  Ringkasan Pesanan
                </CardTitle>
                <CardDescription className="text-xs sm:text-base">
                  Review pesanan Anda sebelum checkout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-4 p-3 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs sm:text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price)} × {item.qty}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground italic truncate mt-1">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs sm:text-sm flex-shrink-0 bg-primary/10 text-primary border-primary/20">
                        {formatCurrency(item.price * item.qty)}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Service Fee</span>
                    <span className="font-semibold">{formatCurrency(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-semibold text-green-600">-{formatCurrency(0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center py-1 sm:py-2 bg-primary/5 rounded px-2 sm:px-3">
                    <span className="font-bold text-sm sm:text-lg">Total</span>
                    <span className="font-bold text-base sm:text-xl text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-2 sm:pb-3">
                <CardTitle className="flex items-center text-sm sm:text-lg">
                  <CreditCard className="h-3 w-3 sm:h-5 sm:w-5 mr-2" />
                  Informasi Pelanggan
                </CardTitle>
                <CardDescription className="text-xs sm:text-base">
                  Lengkapi informasi Anda untuk menyelesaikan pesanan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <FormInput
                      {...register('customerName')}
                      label="Full Name"
                      placeholder="Enter your full name"
                      error={errors.customerName?.message}
                      required
                      disabled={loading}
                    />
                    <FormInput
                      {...register('phone')}
                      label="Phone Number"
                      placeholder="Enter your phone number"
                      error={errors.phone?.message}
                      required
                      disabled={loading}
                    />
                  </div>

                  <FormInput
                    {...register('pickupDate')}
                    label="Pickup Date"
                    type="date"
                    error={errors.pickupDate?.message}
                    required
                    disabled={loading}
                  />

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <FormRadioGroup
                      {...register('paymentMethod')}
                      label="Metode Pembayaran"
                      options={paymentMethodOptions}
                      error={errors.paymentMethod?.message}
                      required
                    />
                  </div>

                  <FormTextarea
                    {...register('notes')}
                    label="Catatan Pesanan (Opsional)"
                    placeholder="Instruksi khusus untuk pesanan Anda..."
                    error={errors.notes?.message}
                    disabled={loading}
                    rows={3}
                  />

                  <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onBack}
                      disabled={loading}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || items.length === 0}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Pesan Sekarang
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
