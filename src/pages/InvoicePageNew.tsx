import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Copy, Download, Check, FileText, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRupiah, formatDateTime } from '../lib/utils';
import { Database } from '../lib/database.types';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF } from '../components/ReceiptPDF';
import { getTenantInfo } from '../lib/tenantUtils';

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
        .eq('order_id', orderData.id);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Load payment method if QRIS
      if (orderData.payment_method === 'QRIS') {
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('tenant_id', resolvedTenantInfo.tenant_id)
          .eq('payment_type', 'QRIS')
          .eq('is_active', true)
          .single();

        if (!paymentError && paymentData) {
          setPaymentMethod(paymentData);
          setQrisImageUrl(paymentData.qris_image_url);
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
          qrisImageUrl={qrisImageUrl}
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
      'BELUM BAYAR': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'SUDAH BAYAR': 'bg-green-100 text-green-800 border-green-200',
      'DIBATALKAN': 'bg-red-100 text-red-800 border-red-200',
    };
    
    return statusConfig[status as keyof typeof statusConfig] || 'bg-muted text-muted-foreground border-border';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invoice tidak ditemukan</h2>
            <p className="text-muted-foreground mb-4">Invoice dengan kode {orderCode} tidak ditemukan</p>
            <Button onClick={onBack} className="w-full">
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
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Invoice</h1>
            <Button
              onClick={downloadPDF}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Struk
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-2 sm:p-4">
        <Card className="shadow-xl border-0">
          {/* Simple Mobile Header */}
          <div className="bg-primary text-primary-foreground p-3 sm:p-8 rounded-t-lg">
            <div className="text-center sm:flex sm:items-center sm:justify-between sm:text-left">
              <div>
                <h1 className="text-lg sm:text-3xl font-bold mb-1 sm:mb-2">{tenantInfo?.tenant_name || 'Kopi Pendekar'}</h1>
                <p className="text-sm sm:text-lg opacity-90">Invoice / Struk Pesanan</p>
              </div>
              <div className="mt-2 sm:mt-0 sm:text-right">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm sm:text-lg px-2 sm:px-4 py-1 sm:py-2">
                  {order.order_code}
                </Badge>
                <p className="text-xs sm:text-sm mt-1 opacity-80">
                  {formatDateTime(order.created_at)}
                </p>
              </div>
            </div>
          </div>

          <CardHeader className="pb-3 sm:pb-6 pt-3 sm:pt-8">
            <div className="text-center sm:flex sm:items-center sm:justify-between sm:text-left">
              <div>
                <h2 className="text-base sm:text-xl font-semibold mb-1">Invoice Details</h2>
                <p className="text-muted-foreground text-xs sm:text-sm">Pesanan dan informasi pembayaran</p>
              </div>
              <div className="mt-2 sm:mt-0 flex justify-center sm:justify-end">
                <Badge className={getStatusBadge(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 sm:space-y-8 p-3 sm:p-6">
            {/* Customer & Order Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-8">
              {/* Customer Information */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                    <FileText className="w-3 h-3 sm:w-5 sm:h-5" />
                    Informasi Pelanggan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-4">
                  <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Nama Lengkap</p>
                      <p className="font-semibold text-sm sm:text-base">{order.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Nomor Telepon</p>
                      <p className="font-semibold text-sm sm:text-base">{order.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Tanggal Pengambilan</p>
                    <p className="font-semibold text-sm sm:text-lg">{order.pickup_date}</p>
                  </div>
                  {order.notes && (
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Catatan Khusus</p>
                      <p className="text-xs sm:text-sm bg-muted p-2 sm:p-3 rounded border-l-2 sm:border-l-4 border-primary">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Information */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                    <FileText className="w-3 h-3 sm:w-5 sm:h-5" />
                    Detail Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-4">
                  <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Tanggal Pesanan</p>
                      <p className="font-semibold text-sm sm:text-base">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Jumlah Item</p>
                      <p className="font-semibold text-sm sm:text-base">{items.length} item</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Pesanan</p>
                    <p className="font-bold text-lg sm:text-2xl text-primary">{formatRupiah(order.total)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className="text-sm sm:text-xl font-semibold mb-3 sm:mb-6 flex items-center gap-2">
                <FileText className="w-3 h-3 sm:w-5 sm:h-5" />
                Item Pesanan
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    {/* Mobile: Card Layout, Desktop: Table Layout */}
                    <div className="block sm:hidden">
                      {/* Mobile Card Layout */}
                      <div className="space-y-3 p-3">
                        {items.map((item, index) => (
                          <div key={item.id} className="bg-muted/30 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-semibold text-sm flex-1 pr-2">{item.name_snapshot}</p>
                              <Badge variant="outline" className="font-semibold text-xs">
                                {item.qty}x
                              </Badge>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground mb-2 bg-muted/50 px-2 py-1 rounded">
                                {item.notes}
                              </p>
                            )}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">{formatRupiah(item.price_snapshot)} × {item.qty}</span>
                              <span className="font-bold text-primary">{formatRupiah(item.line_total)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden sm:block">
                      {/* Table Header */}
                      <div className="bg-muted/50 border-b border-border">
                        <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground">
                          <div className="col-span-6">Item</div>
                          <div className="col-span-2 text-center">Qty</div>
                          <div className="col-span-2 text-right">Harga Satuan</div>
                          <div className="col-span-2 text-right">Total</div>
                        </div>
                      </div>
                      
                      {/* Table Rows */}
                      <div className="divide-y divide-border">
                        {items.map((item, index) => (
                          <div key={item.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/30 transition-colors">
                            <div className="col-span-6">
                              <p className="font-semibold text-base">{item.name_snapshot}</p>
                              {item.notes && (
                                <p className="text-sm text-muted-foreground mt-1 bg-muted/50 px-2 py-1 rounded text-xs">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="col-span-2 text-center">
                              <Badge variant="outline" className="font-semibold">
                                {item.qty}
                              </Badge>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className="font-medium">{formatRupiah(item.price_snapshot)}</p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className="font-bold text-primary">{formatRupiah(item.line_total)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Total Summary */}
            <Card className="bg-gradient-to-r from-muted/50 to-muted/30">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  <FileText className="w-3 h-3 sm:w-5 sm:h-5" />
                  Ringkasan Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-4">
                <div className="space-y-1 sm:space-y-3">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground font-medium text-xs sm:text-base">Subtotal</span>
                    <span className="font-semibold text-sm sm:text-lg">{formatRupiah(order.subtotal)}</span>
                  </div>
                  
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground font-medium text-xs sm:text-base">Diskon</span>
                      <span className="font-semibold text-sm sm:text-lg text-green-600">-{formatRupiah(order.discount)}</span>
                    </div>
                  )}
                  
                  {order.service_fee > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground font-medium text-xs sm:text-base">Biaya Layanan</span>
                      <span className="font-semibold text-sm sm:text-lg">{formatRupiah(order.service_fee)}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center py-2 sm:py-4 bg-primary/5 rounded px-2 sm:px-4">
                  <span className="font-bold text-sm sm:text-xl">TOTAL PEMBAYARAN</span>
                  <span className="font-bold text-lg sm:text-3xl text-primary">
                    {formatRupiah(order.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  {order.payment_method === 'QRIS' && <Smartphone className="w-3 h-3 sm:w-5 sm:h-5" />}
                  {order.payment_method === 'TRANSFER' && <Banknote className="w-3 h-3 sm:w-5 sm:h-5" />}
                  {order.payment_method === 'COD' && <CreditCard className="w-3 h-3 sm:w-5 sm:h-5" />}
                  Metode Pembayaran: {order.payment_method}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs sm:text-sm">
                    {order.payment_method}
                  </Badge>
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    {order.payment_method === 'QRIS' && 'Pembayaran digital via QRIS'}
                    {order.payment_method === 'TRANSFER' && 'Transfer bank'}
                    {order.payment_method === 'COD' && 'Bayar tunai saat mengambil pesanan'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* QRIS Payment */}
            {order.payment_method === 'QRIS' && qrisImageUrl && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="text-center pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-xl flex items-center justify-center gap-2">
                    <Smartphone className="w-4 h-4 sm:w-6 sm:h-6" />
                    Pembayaran QRIS
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-base">
                    Scan kode QRIS di bawah ini untuk melakukan pembayaran
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-white p-2 sm:p-6 rounded shadow-lg inline-block">
                    <img
                      src={qrisImageUrl}
                      alt="QRIS Code"
                      className="w-32 h-32 sm:w-56 sm:h-56 border border-border rounded"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-4">
                    Total yang harus dibayar: <span className="font-bold text-primary text-sm sm:text-lg">{formatRupiah(order.total)}</span>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Bank Transfer */}
            {order.payment_method === 'TRANSFER' && paymentMethod && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="text-center pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-xl flex items-center justify-center gap-2">
                    <Banknote className="w-4 h-4 sm:w-6 sm:h-6" />
                    Transfer Bank
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-base">
                    Transfer ke rekening berikut sesuai dengan total pesanan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-2 sm:p-6 rounded shadow-lg">
                    <div className="space-y-2 sm:space-y-4">
                      <div className="flex justify-between items-center py-1 sm:py-3 border-b border-border">
                        <span className="text-muted-foreground font-medium text-xs sm:text-base">Bank:</span>
                        <span className="font-bold text-sm sm:text-lg">{paymentMethod.bank_name}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 sm:py-3 border-b border-border">
                        <span className="text-muted-foreground font-medium text-xs sm:text-base">No. Rekening:</span>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="font-bold text-sm sm:text-lg font-mono">{paymentMethod.account_number}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(paymentMethod.account_number, 'account')}
                            className="p-1 hover:bg-muted rounded transition-colors"
                          >
                            {copied === 'account' ? (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                            ) : (
                              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1 sm:py-3 border-b border-border">
                        <span className="text-muted-foreground font-medium text-xs sm:text-base">Atas Nama:</span>
                        <span className="font-bold text-sm sm:text-lg">{paymentMethod.account_holder}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 sm:py-3 bg-primary/5 rounded px-2 sm:px-4">
                        <span className="text-muted-foreground font-medium text-xs sm:text-base">Total Transfer:</span>
                        <span className="font-bold text-sm sm:text-xl text-primary">{formatRupiah(order.total)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-4 text-center">
                    Pastikan nominal transfer sesuai dengan total pesanan
                  </p>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => copyToClipboard(paymentMethod.account_number, 'account')}
                    >
                      {copied === 'account' ? (
                        <Check className="w-4 h-4 text-primary mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy Nomor Rekening
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => copyToClipboard(paymentMethod.account_holder, 'holder')}
                    >
                      {copied === 'holder' ? (
                        <Check className="w-4 h-4 text-primary mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy Nama Pemilik
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Pastikan nominal transfer sesuai dengan total pesanan dan sertakan kode pesanan sebagai keterangan.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Professional Footer */}
            <Card className="bg-gradient-to-r from-muted/30 to-muted/50 border-0 mt-8">
              <CardContent className="text-center py-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Terima Kasih Atas Pesanan Anda!</h3>
                  <p className="text-muted-foreground">
                    Pesanan Anda akan segera diproses dan siap untuk diambil sesuai jadwal yang telah ditentukan.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
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
    </div>
  );
}
