import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Copy, Download, Check, FileText, CreditCard, Smartphone, Banknote, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRupiah, formatDateTime } from '../lib/utils';
import { Database } from '../lib/database.types';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF } from '../components/ReceiptPDF';
import { ThermalReceipt } from '../components/ThermalReceipt';
import { getTenantInfo } from '../lib/tenantUtils';
import { colors, typography, components, sizes, shadows, cn } from '@/lib/design-system';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];

interface InvoicePageProps {
  orderCode: string;
  onBack: () => void;
}

export function InvoicePage({ orderCode, onBack }: InvoicePageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);

  useEffect(() => {
    loadData();
  }, [orderCode]);

  const loadData = async () => {
    try {
      // Get tenant info
      const resolvedTenantInfo = await getTenantInfo();
      setTenantInfo(resolvedTenantInfo);

      // Load order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_code', orderCode)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Load order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', (orderData as any).id);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Load payment method if QRIS
      if ((orderData as any).payment_method === 'QRIS') {
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('tenant_id', (resolvedTenantInfo as any).tenant_id)
          .eq('payment_type', 'QRIS')
          .eq('is_active', true)
          .single();

        if (!paymentError && paymentData) {
          setPaymentMethod(paymentData);
          setQrisImageUrl((paymentData as any).qris_image_url);
        }
      }

    } catch (error) {
      console.error('Error loading invoice data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadPDF = async () => {
    if (!order) return;

    try {
      // Generate PDF using @react-pdf/renderer
      const blob = await pdf(
        <ReceiptPDF 
          order={order}
          items={items}
          tenantInfo={tenantInfo}
          paymentMethod={paymentMethod}
          qrisImageUrl={qrisImageUrl || undefined}
        />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `struk-${order.order_code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'BELUM BAYAR': cn(colors.status.warning.bg, colors.status.warning.text, colors.status.warning.border),
      'SUDAH BAYAR': cn(colors.status.success.bg, colors.status.success.text, colors.status.success.border),
      'DIBATALKAN': cn(colors.status.error.bg, colors.status.error.text, colors.status.error.border),
    };
    
    return statusConfig[status as keyof typeof statusConfig] || cn(colors.background.muted, colors.text.muted, colors.border);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className={cn(typography.body.medium, colors.text.secondary)}>Memuat invoice...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className={cn(components.card, shadows.lg, "w-full max-w-md text-center")}>
          <CardContent className="pt-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className={cn(typography.h3, "mb-2")}>Invoice tidak ditemukan</h2>
            <p className={cn(typography.body.medium, colors.text.secondary, "mb-4")}>
              Invoice dengan kode {orderCode} tidak ditemukan
            </p>
            <Button onClick={onBack} className={cn(components.buttonPrimary, "w-full")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={cn(typography.h2)}>Invoice</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        <Card className={cn(components.card, shadows.xl, "border-0")}>
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
            <div className="text-center">
              <h1 className={cn(typography.h1, "text-white mb-2")}>
                {tenantInfo?.tenant_name || 'Kopi Pendekar'}
              </h1>
              <p className={cn(typography.body.large, "text-white/90 mb-4")}>
                Invoice / Struk Pesanan
              </p>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-lg px-6 py-3 mb-2">
                {order.order_code}
              </Badge>
              <p className={cn(typography.body.small, "text-white/80")}>
                {formatDateTime(order.created_at)}
              </p>
            </div>
          </div>

          <CardHeader className="pb-3 pt-6">
            <div className="text-center">
              <h2 className={cn(typography.h3, "mb-1")}>Invoice Details</h2>
              <p className={cn(typography.body.medium, colors.text.secondary, "mb-4")}>
                Pesanan dan informasi pembayaran
              </p>
              <Badge className={getStatusBadge(order.status)}>
                {order.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className={cn("space-y-6", sizes.card.lg)}>
            {/* Customer & Order Information */}
            <div className="grid grid-cols-1 gap-6">
              {/* Customer Information */}
              <Card className={cn("bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200")}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("flex items-center gap-2", typography.h4)}>
                    <FileText className="w-5 h-5" />
                    Informasi Pelanggan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className={cn(typography.label.medium, colors.text.secondary, "mb-1")}>Nama Lengkap</p>
                      <p className={cn(typography.h4)}>{order.customer_name}</p>
                    </div>
                    <div>
                      <p className={cn(typography.label.medium, colors.text.secondary, "mb-1")}>Nomor Telepon</p>
                      <p className={cn(typography.h4)}>{order.phone}</p>
                    </div>
                    <div>
                      <p className={cn(typography.label.medium, colors.text.secondary, "mb-1")}>Tanggal Pengambilan</p>
                      <p className={cn(typography.price.medium)}>{order.pickup_date}</p>
                    </div>
                    {order.notes && (
                      <div>
                        <p className={cn(typography.label.medium, colors.text.secondary, "mb-1")}>Catatan Khusus</p>
                        <p className={cn(typography.body.small, "bg-white/50 p-3 rounded border-l-4 border-blue-500")}>
                          {order.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className={cn(typography.h3, "mb-4 flex items-center gap-2")}>
                <FileText className="w-5 h-5" />
                Item Pesanan
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    {/* Mobile Card Layout */}
                    <div className="space-y-3 p-4">
                      {items.map((item) => (
                        <div key={item.id} className={cn(components.card, "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 p-4")}>
                          <div className="flex justify-between items-start mb-3">
                            <p className={cn(typography.h4, "flex-1 pr-2")}>{item.name_snapshot}</p>
                            <Badge variant="outline" className={cn(components.badge, "bg-blue-50 text-blue-700 border-blue-200")}>
                              {item.qty}x
                            </Badge>
                          </div>
                          {item.notes && (
                            <p className={cn(typography.body.small, colors.text.muted, "mb-3 bg-white/50 px-3 py-2 rounded border-l-4 border-blue-500")}>
                              {item.notes}
                            </p>
                          )}
                          <div className="flex justify-between items-center">
                            <span className={cn(typography.body.small, colors.text.secondary)}>
                              {formatRupiah(item.price_snapshot)} × {item.qty}
                            </span>
                            <span className={cn(typography.price.medium, colors.text.blue)}>
                              {formatRupiah(item.line_total)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Total Summary */}
            <Card className={cn("bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200")}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("flex items-center gap-2", typography.h4)}>
                  <FileText className="w-5 h-5" />
                  Ringkasan Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className={cn(typography.label.medium, colors.text.secondary)}>Subtotal</span>
                    <span className={cn(typography.price.medium)}>{formatRupiah(order.subtotal)}</span>
                  </div>
                  
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className={cn(typography.label.medium, colors.text.secondary)}>Diskon</span>
                      <span className={cn(typography.price.medium, colors.text.green)}>-{formatRupiah(order.discount)}</span>
                    </div>
                  )}
                  
                  {order.service_fee > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className={cn(typography.label.medium, colors.text.secondary)}>Biaya Layanan</span>
                      <span className={cn(typography.price.medium)}>{formatRupiah(order.service_fee)}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-4 bg-white/50 rounded-lg px-4">
                  <span className={cn(typography.h4)}>TOTAL PEMBAYARAN</span>
                  <span className={cn(typography.price.large, colors.text.blue)}>
                    {formatRupiah(order.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className={cn("bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200")}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("flex items-center gap-2", typography.h4)}>
                  {order.payment_method === 'QRIS' && <Smartphone className="w-5 h-5" />}
                  {order.payment_method === 'TRANSFER' && <Banknote className="w-5 h-5" />}
                  {order.payment_method === 'COD' && <CreditCard className="w-5 h-5" />}
                  Metode Pembayaran: {order.payment_method}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Badge variant="outline" className={cn(components.badge, "bg-blue-50 text-blue-700 border-blue-200")}>
                    {order.payment_method}
                  </Badge>
                  <span className={cn(typography.body.small, colors.text.secondary)}>
                    {order.payment_method === 'QRIS' && 'Pembayaran digital via QRIS'}
                    {order.payment_method === 'TRANSFER' && 'Transfer bank'}
                    {order.payment_method === 'COD' && 'Bayar tunai saat mengambil pesanan'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* QRIS Payment */}
            {order.payment_method === 'QRIS' && qrisImageUrl && (
              <Card className={cn("bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200")}>
                <CardHeader className="text-center pb-3">
                  <CardTitle className={cn("flex items-center justify-center gap-2", typography.h4)}>
                    <Smartphone className="w-6 h-6" />
                    Pembayaran QRIS
                  </CardTitle>
                  <CardDescription className={cn(typography.body.medium, colors.text.secondary)}>
                    Scan kode QRIS di bawah ini untuk melakukan pembayaran
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-white p-6 rounded-lg shadow-lg inline-block">
                    <img
                      src={qrisImageUrl}
                      alt="QRIS Code"
                      className="w-56 h-56 border border-gray-200 rounded"
                    />
                  </div>
                  <p className={cn(typography.body.small, colors.text.secondary, "mt-4")}>
                    Total yang harus dibayar: <span className={cn(typography.price.medium, colors.text.blue)}>{formatRupiah(order.total)}</span>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Bank Transfer */}
            {order.payment_method === 'TRANSFER' && paymentMethod && (
              <Card className={cn("bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200")}>
                <CardHeader className="text-center pb-3">
                  <CardTitle className={cn("flex items-center justify-center gap-2", typography.h4)}>
                    <Banknote className="w-6 h-6" />
                    Transfer Bank
                  </CardTitle>
                  <CardDescription className={cn(typography.body.medium, colors.text.secondary)}>
                    Transfer ke rekening berikut sesuai dengan total pesanan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className={cn(typography.label.medium, colors.text.secondary)}>Bank:</span>
                        <span className={cn(typography.price.medium)}>{paymentMethod.bank_name}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className={cn(typography.label.medium, colors.text.secondary)}>No. Rekening:</span>
                        <div className="flex items-center gap-2">
                          <span className={cn(typography.price.medium, "font-mono")}>{paymentMethod.account_number}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(paymentMethod.account_number || '', 'account')}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            {copied === 'account' ? (
                              <Check className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className={cn(typography.label.medium, colors.text.secondary)}>Atas Nama:</span>
                        <span className={cn(typography.price.medium)}>{paymentMethod.account_holder}</span>
                      </div>
                      <div className="flex justify-between items-center py-4 bg-blue-50 rounded-lg px-4">
                        <span className={cn(typography.label.medium, colors.text.secondary)}>Total Transfer:</span>
                        <span className={cn(typography.price.large, colors.text.blue)}>{formatRupiah(order.total)}</span>
                      </div>
                    </div>
                  </div>
                  <p className={cn(typography.body.small, colors.text.secondary, "mt-4 text-center")}>
                    Pastikan nominal transfer sesuai dengan total pesanan
                  </p>

                  <div className="space-y-2 mt-4">
                    <Button
                      variant="outline"
                      className={cn(components.buttonOutline, "w-full justify-start")}
                      onClick={() => copyToClipboard(paymentMethod.account_number || '', 'account')}
                    >
                      {copied === 'account' ? (
                        <Check className="w-4 h-4 text-blue-600 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy Nomor Rekening
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(components.buttonOutline, "w-full justify-start")}
                      onClick={() => copyToClipboard(paymentMethod.account_holder || '', 'holder')}
                    >
                      {copied === 'holder' ? (
                        <Check className="w-4 h-4 text-blue-600 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy Nama Pemilik
                    </Button>
                  </div>

                  <p className={cn(typography.body.small, colors.text.muted, "mt-4")}>
                    Pastikan nominal transfer sesuai dengan total pesanan dan sertakan kode pesanan sebagai keterangan.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mt-6">
              <Button
                onClick={() => setShowThermalReceipt(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Struk
              </Button>
              
              <Button
                onClick={downloadPDF}
                className={cn(components.buttonPrimary)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Struk
              </Button>
            </div>

            {/* Professional Footer */}
            <Card className={cn("bg-gradient-to-r from-gray-50 to-gray-100 border-0 mt-6")}>
              <CardContent className="text-center py-6">
                <div className="space-y-2">
                  <h3 className={cn(typography.h3)}>Terima Kasih Atas Pesanan Anda!</h3>
                  <p className={cn(typography.body.medium, colors.text.secondary)}>
                    Pesanan Anda akan segera diproses dan siap untuk diambil sesuai jadwal yang telah ditentukan.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <span>Invoice: {order.order_code}</span>
                    <span>•</span>
                    <span>{formatDateTime(order.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Thermal Receipt Modal */}
      {showThermalReceipt && order && tenantInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className={cn(typography.h3)}>Print Struk Thermal</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThermalReceipt(false)}
                  className={cn(components.buttonOutline)}
                >
                  ✕
                </Button>
              </div>
              
              <ThermalReceipt
                order={{
                  ...order,
                  order_code: order.order_code || '',
                  notes: order.notes || undefined,
                  order_items: items.map(item => ({
                    ...item,
                    notes: item.notes || undefined
                  })),
                  payment_methods: paymentMethod ? [paymentMethod as any] : []
                }}
                tenant={tenantInfo}
                onClose={() => setShowThermalReceipt(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
