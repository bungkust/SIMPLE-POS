import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, ArrowLeft, ShoppingBag, CreditCard, Smartphone, Banknote, Download, Copy, Printer, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppToast } from '@/components/ui/toast-provider';
import { ThermalReceipt } from '@/components/ThermalReceipt';

interface OrderSuccessPageProps {
  orderCode: string;
  onViewInvoice: () => void;
  onBackToMenu: () => void;
}

interface OrderData {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  payment_method: string;
  total: number;
  status: string;
  pickup_date: string;
  created_at: string;
  subtotal: number;
  discount: number;
  service_fee: number;
  notes?: string;
  order_items: any[];
}

export function OrderSuccessPage({ orderCode, onViewInvoice, onBackToMenu }: OrderSuccessPageProps) {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);
  const [tenantData, setTenantData] = useState<any>(null);
  const { showSuccess, showError } = useAppToast();

  useEffect(() => {
    loadOrderData();
  }, [orderCode]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      
      // Load order data with order items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('order_code', orderCode)
        .single();

      if (orderError) {
        console.error('Error loading order:', orderError);
        showError('Error', 'Gagal memuat data pesanan.');
        return;
      }

      setOrderData(order);

      // Load payment methods for this tenant
      const { data: methods, error: methodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('tenant_id', order.tenant_id)
        .eq('is_active', true)
        .order('sort_order');

      console.log('🔍 Loaded payment methods:', methods);
      if (methods) {
        // Check and fix old QRIS URLs in database
        const methodsToUpdate = methods.filter(method => 
          method.payment_type === 'QRIS' && 
          method.qris_image_url && 
          method.qris_image_url.includes('store-icons/payment-methods/')
        );

        if (methodsToUpdate.length > 0) {
          console.log('🔧 Found QRIS methods with old URLs, updating in database...');
          
          for (const method of methodsToUpdate) {
            const newUrl = method.qris_image_url.replace(
              'store-icons/payment-methods/',
              'qris-images/qris/'
            );
            
            console.log(`🔄 Updating QRIS URL for method ${method.id}:`);
            console.log(`  Old: ${method.qris_image_url}`);
            console.log(`  New: ${newUrl}`);
            
            const { error: updateError } = await supabase
              .from('payment_methods')
              .update({ qris_image_url: newUrl })
              .eq('id', method.id);
            
            if (updateError) {
              console.error(`❌ Error updating QRIS URL for method ${method.id}:`, updateError);
            } else {
              console.log(`✅ Successfully updated QRIS URL for method ${method.id}`);
              // Update the method in the local array
              method.qris_image_url = newUrl;
            }
          }
        }

        methods.forEach(method => {
          if (method.payment_type === 'QRIS') {
            console.log('🔍 QRIS method found:', method);
            console.log('🔍 QRIS image URL:', method.qris_image_url);
            console.log('🔍 Expected URL should contain: qris-images/qris/');
            if (method.qris_image_url) {
              console.log('🔍 URL contains qris-images:', method.qris_image_url.includes('qris-images'));
              console.log('🔍 URL contains qris folder:', method.qris_image_url.includes('/qris/'));
            }
          }
        });
      }

      if (methodsError) {
        console.error('Error loading payment methods:', methodsError);
      } else {
        setPaymentMethods(methods || []);
      }

      // Load tenant data for thermal receipt
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', order.tenant_id)
        .single();

      if (tenantError) {
        console.error('Error loading tenant:', tenantError);
      } else {
        setTenantData(tenant);
      }
    } catch (error) {
      console.error('Error loading order data:', error);
      showError('Error', 'Gagal memuat data pesanan.');
    } finally {
      setLoading(false);
    }
  };

      const getPaymentMethodInfo = () => {
        if (!orderData || !paymentMethods.length) return null;
        
        const method = paymentMethods.find(m => m.payment_type === orderData.payment_method);
        if (method) {
          console.log('🔍 Payment method info:', method);
          console.log('🔍 QRIS image URL:', method.qris_image_url);
          
          // Fix old QRIS URLs on the fly
          if (method.payment_type === 'QRIS' && method.qris_image_url && 
              method.qris_image_url.includes('store-icons/payment-methods/')) {
            const fixedUrl = method.qris_image_url.replace(
              'store-icons/payment-methods/',
              'qris-images/qris/'
            );
            console.log('🔧 Fixed QRIS URL on the fly:', fixedUrl);
            return { ...method, qris_image_url: fixedUrl };
          }
        }
        return method;
      };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Copied', `${label} berhasil disalin ke clipboard.`);
    } catch (error) {
      showError('Error', 'Gagal menyalin ke clipboard.');
    }
  };

  const downloadQRIS = (imageUrl: string) => {
    console.log('🔍 Downloading QRIS from URL:', imageUrl);
    
    // Ensure URL is valid
    if (!imageUrl || !imageUrl.startsWith('http')) {
      showError('Download Failed', 'URL QRIS tidak valid.');
      return;
    }
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `qris-${orderCode}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Download', 'QRIS berhasil didownload.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  const paymentMethodInfo = getPaymentMethodInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Professional Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Pesanan Berhasil</h1>
              <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
                Konfirmasi pesanan Anda
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-2 sm:p-4 pb-40 sm:pb-8">
        <Card className="shadow-xl border-0">
          {/* Simple Mobile Header */}
          <div className="bg-primary text-primary-foreground p-3 sm:p-8 rounded-t-lg">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle className="w-6 h-6 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <h1 className="text-lg sm:text-3xl font-bold mb-1 sm:mb-2">Pesanan Berhasil Dibuat!</h1>
              <p className="text-sm sm:text-lg opacity-90">
                Pesanan Anda telah berhasil dibuat dan akan segera diproses
              </p>
            </div>
          </div>

          <CardHeader className="pb-3 sm:pb-6 pt-3 sm:pt-8">
            <div className="text-center">
              <h2 className="text-sm sm:text-xl font-semibold mb-1">Konfirmasi Pesanan</h2>
              <p className="text-muted-foreground text-xs sm:text-base">Detail pesanan Anda</p>
            </div>
          </CardHeader>
        
          <CardContent className="space-y-3 sm:space-y-8 p-3 sm:p-6">
            {/* Order Code Section */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-lg flex items-center justify-center gap-2">
                  <FileText className="w-3 h-3 sm:w-5 sm:h-5" />
                  Kode Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-sm sm:text-xl px-3 sm:px-6 py-2 sm:py-3 mb-3 sm:mb-4">
                  {orderCode}
                </Badge>
                <p className="text-muted-foreground text-xs sm:text-base">
                  Simpan kode pesanan ini untuk referensi dan tracking
                </p>
              </CardContent>
            </Card>

            {/* Payment Information Section */}
            {paymentMethodInfo && (
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-lg flex items-center justify-center gap-2">
                    {orderData?.payment_method === 'TRANSFER' && <CreditCard className="w-3 h-3 sm:w-5 sm:h-5" />}
                    {orderData?.payment_method === 'QRIS' && <Smartphone className="w-3 h-3 sm:w-5 sm:h-5" />}
                    {orderData?.payment_method === 'COD' && <Banknote className="w-3 h-3 sm:w-5 sm:h-5" />}
                    Informasi Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Method Name */}
                  <div className="text-center">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2">
                      {paymentMethodInfo.name}
                    </Badge>
                    {paymentMethodInfo.description && (
                      <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                        {paymentMethodInfo.description}
                      </p>
                    )}
                  </div>

                  {/* Bank Transfer Information */}
                  {orderData?.payment_method === 'TRANSFER' && (
                    <div className="space-y-3">
                      <div className="bg-background/50 rounded-lg p-3 sm:p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm sm:text-base font-medium">Bank:</span>
                          <span className="text-sm sm:text-base">{paymentMethodInfo.bank_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm sm:text-base font-medium">No. Rekening:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-mono">{paymentMethodInfo.account_number || 'N/A'}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(paymentMethodInfo.account_number || '', 'Nomor rekening')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm sm:text-base font-medium">Atas Nama:</span>
                          <span className="text-sm sm:text-base">{paymentMethodInfo.account_holder || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Silakan transfer sesuai nominal pesanan Anda
                        </p>
                      </div>
                    </div>
                  )}

                  {/* QRIS Information */}
                  {orderData?.payment_method === 'QRIS' && (
                    <div className="space-y-3">
                      {paymentMethodInfo.qris_image_url ? (
                        <>
                          <div className="bg-background/50 rounded-lg p-3 sm:p-4 text-center">
                            <img
                              src={paymentMethodInfo.qris_image_url}
                              alt="QRIS Code"
                              className="w-32 h-32 sm:w-48 sm:h-48 mx-auto rounded-lg border-2 border-primary/20"
                              onLoad={() => {
                                console.log('✅ QRIS image loaded successfully from:', paymentMethodInfo.qris_image_url);
                              }}
                              onError={(e) => {
                                console.error('❌ QRIS image failed to load:', paymentMethodInfo.qris_image_url);
                                console.error('❌ Expected URL structure: qris-images/qris/{tenant_id}/{filename}');
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden w-32 h-32 sm:w-48 sm:h-48 mx-auto rounded-lg border-2 border-primary/20 bg-muted/20 flex items-center justify-center">
                              <div className="text-center">
                                <Smartphone className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">QRIS tidak tersedia</p>
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                              Scan QRIS untuk melakukan pembayaran
                            </p>
                          </div>
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadQRIS(paymentMethodInfo.qris_image_url)}
                              className="text-xs sm:text-sm"
                            >
                              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Download QRIS
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="bg-background/50 rounded-lg p-3 sm:p-4 text-center">
                          <div className="w-32 h-32 sm:w-48 sm:h-48 mx-auto rounded-lg border-2 border-primary/20 bg-muted/20 flex items-center justify-center">
                            <div className="text-center">
                              <Smartphone className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">QRIS tidak tersedia</p>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                            QRIS belum dikonfigurasi untuk metode pembayaran ini
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* COD Information */}
                  {orderData?.payment_method === 'COD' && (
                    <div className="text-center">
                      <div className="bg-background/50 rounded-lg p-3 sm:p-4">
                        <p className="text-sm sm:text-base text-muted-foreground">
                          Pembayaran dilakukan saat pesanan diambil
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Total Amount */}
                  <div className="text-center border-t border-primary/20 pt-3">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Pembayaran</p>
                    <p className="text-lg sm:text-2xl font-bold text-primary">
                      Rp {orderData?.total?.toLocaleString('id-ID') || '0'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => setShowThermalReceipt(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-base"
                size="sm"
              >
                <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Print Struk
              </Button>
              
              <Button
                onClick={onViewInvoice}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-base"
                size="sm"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Lihat Invoice
              </Button>
              
              <Button
                onClick={onBackToMenu}
                variant="outline"
                className="flex-1 text-xs sm:text-base"
                size="sm"
              >
                <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Kembali ke Kasir
              </Button>
            </div>

            {/* Professional Footer */}
            <Card className="bg-gradient-to-r from-muted/30 to-muted/50 border-0 mt-3 sm:mt-8">
              <CardContent className="text-center py-3 sm:py-6">
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground">Terima Kasih Atas Pesanan Anda!</h3>
                  <p className="text-muted-foreground text-xs sm:text-base">
                    Pesanan Anda akan segera diproses dan siap untuk diambil sesuai jadwal yang telah ditentukan.
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Thermal Receipt Modal */}
      {showThermalReceipt && orderData && tenantData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Print Struk Thermal</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThermalReceipt(false)}
                >
                  ✕
                </Button>
              </div>
              
              <ThermalReceipt
                order={{
                  ...orderData,
                  payment_methods: paymentMethods
                }}
                tenant={tenantData}
                onClose={() => setShowThermalReceipt(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
