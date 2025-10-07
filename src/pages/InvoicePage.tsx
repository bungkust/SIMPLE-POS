import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Download, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRupiah, formatDateTime } from '../lib/utils';
import { Database } from '../lib/database.types';
import jsPDF from 'jspdf';

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

  useEffect(() => {
    loadOrder();
  }, [orderCode]);

  const loadOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_code', orderCode)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Load QRIS image if payment method is QRIS
      if (orderData.payment_method === 'QRIS') {
        try {
          const { data: paymentMethods, error: pmError } = await supabase
            .from('payment_methods')
            .select('qris_image_url')
            .eq('payment_type', 'QRIS')
            .eq('is_active', true)
            .limit(1);

          if (!pmError && paymentMethods && paymentMethods.length > 0) {
            setQrisImageUrl(paymentMethods[0].qris_image_url);
          }
        } catch (error) {
          console.warn('Could not load QRIS image:', error);
        }
      }

      // Load payment method details if payment method is TRANSFER
      if (orderData.payment_method === 'TRANSFER') {
        try {
          const { data: paymentMethods, error: pmError } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('payment_type', 'TRANSFER')
            .eq('is_active', true)
            .limit(1);

          if (!pmError && paymentMethods && paymentMethods.length > 0) {
            setPaymentMethod(paymentMethods[0]);
          }
        } catch (error) {
          console.warn('Could not load payment method details:', error);
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Gagal memuat invoice');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadPDF = () => {
    if (!order) {
      alert('Data invoice tidak tersedia');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 25;

      // 1. HEADER SECTION
      doc.setFontSize(16);
      doc.text('KOPI PENDEKAR', pageWidth / 2, y, { align: 'center' });
      y += 8;

      doc.setFontSize(12);
      doc.text('Jl. Contoh No. 123, Jakarta', pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.text('Telp: (021) 12345678 | Email: info@kopipendekar.com', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Bill number and cashier
      doc.setFontSize(10);
      doc.text(`Bill No: ${order.order_code}`, 20, y);
      y += 5;
      doc.text(`Kasir: Admin`, 20, y);
      y += 10;

      // 2. TRANSACTION INFO
      doc.setFontSize(10);
      doc.text(`Kode CHK: ${order.order_code}`, 20, y);
      y += 5;
      doc.text(`Order Type: ${order.pickup_date ? 'Take Away' : 'Dine In'}`, 20, y);
      y += 10;

      // Items list with detailed formatting
      doc.setFontSize(9);
      let itemNumber = 1;

      items.forEach((item) => {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 20;
        }

        // Main item line
        const mainItemText = `${itemNumber} ${item.name_snapshot} ${item.qty}          ${formatRupiah(item.line_total)}`;
        doc.text(mainItemText, 20, y);
        y += 5;

        // Item notes if any
        if (item.notes) {
          doc.setFontSize(8);
          doc.text(`  ${item.notes}`, 25, y);
          y += 4;
          doc.setFontSize(9);
        }

        itemNumber++;
      });

      y += 10;

      // 3. PAYMENT SUMMARY
      if (y > pageHeight - 80) {
        doc.addPage();
        y = 20;
      }

      // Draw line separator
      doc.line(20, y, pageWidth - 20, y);
      y += 10;

      doc.setFontSize(10);
      const subtotalText = `Subtotal                ${formatRupiah(order.subtotal)}`;
      doc.text(subtotalText, 20, y);
      y += 6;

      if (order.discount > 0) {
        const discountText = `Diskon                  -${formatRupiah(order.discount)}`;
        doc.text(discountText, 20, y);
        y += 6;
      }

      if (order.service_fee > 0) {
        const serviceText = `Biaya Layanan           ${formatRupiah(order.service_fee)}`;
        doc.text(serviceText, 20, y);
        y += 6;
      }

      // Total line
      doc.setFontSize(11);
      doc.text(`Total                   ${formatRupiah(order.total)}`, 20, y);
      y += 8;

      // Payment method
      doc.setFontSize(10);
      doc.text(`Payment Method: ${order.payment_method}`, 20, y);
      y += 6;

      // Add bank transfer details if payment method is TRANSFER
      if (order.payment_method === 'TRANSFER' && paymentMethod) {
        y += 4;
        doc.text(`Bank: ${paymentMethod.bank_name}`, 20, y);
        y += 5;
        doc.text(`Account Number: ${paymentMethod.account_number}`, 20, y);
        y += 5;
        doc.text(`Account Holder: ${paymentMethod.account_holder}`, 20, y);
        y += 8;
      }

      if (order.status === 'SUDAH BAYAR') {
        doc.text(`Status: Lunas`, 20, y);
      } else {
        doc.text(`Status: ${order.status}`, 20, y);
      }

      y += 15;

      // 4. FOOTER SECTION
      doc.setFontSize(8);
      doc.text('All Price are inclusive Tax 10%', 20, y);
      y += 5;

      doc.setFontSize(9);
      doc.text('PT. Kopi Pendekar Indonesia', 20, y);
      y += 4;
      doc.text('NPWP: 02.107.429.9-073.000', 20, y);
      y += 4;
      doc.text('Jl. Jend. Sudirman Kav. 86', 20, y);
      y += 4;
      doc.text('Jakarta Pusat 10220', 20, y);
      y += 8;

      // Transaction details
      doc.setFontSize(8);
      doc.text(`Status: ${order.status === 'SUDAH BAYAR' ? 'Check Closed' : order.status}`, 20, y);
      y += 4;
      doc.text(`Tanggal: ${formatDateTime(order.created_at)}`, 20, y);

      // Save PDF
      const fileName = `Invoice-${order.order_code}.pdf`;

      // Alternative: Create blob and download link for better browser compatibility
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('PDF downloaded successfully:', fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Invoice tidak ditemukan</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    'BELUM BAYAR': 'bg-orange-100 text-orange-700',
    'SUDAH BAYAR': 'bg-green-100 text-green-700',
    'DIBATALKAN': 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Invoice</h1>
          </div>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center mb-6 pb-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Kopi Pendekar</h2>
            <p className="text-slate-600">Invoice / Struk Pesanan</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-slate-600">Order Code</p>
                <p className="text-lg font-bold text-slate-900">{order.order_code}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[order.status]
                }`}
              >
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Tanggal Pesanan</p>
                <p className="font-medium text-slate-900">{formatDateTime(order.created_at)}</p>
              </div>
              <div>
                <p className="text-slate-600">Tanggal Ambil</p>
                <p className="font-medium text-slate-900">{order.pickup_date}</p>
              </div>
              <div>
                <p className="text-slate-600">Nama</p>
                <p className="font-medium text-slate-900">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-slate-600">No. HP</p>
                <p className="font-medium text-slate-900">{order.phone}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">Item Pesanan</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.name_snapshot}</p>
                    {item.notes && (
                      <p className="text-sm text-slate-500">Catatan: {item.notes}</p>
                    )}
                    <p className="text-sm text-slate-600">
                      {item.qty} x {formatRupiah(item.price_snapshot)}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {formatRupiah(item.line_total)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon</span>
                  <span>-{formatRupiah(order.discount)}</span>
                </div>
              )}
              {order.service_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Biaya Layanan</span>
                  <span className="font-medium">{formatRupiah(order.service_fee)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
              <span className="font-bold text-lg text-slate-900">TOTAL</span>
              <span className="font-bold text-2xl text-green-600">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-slate-900 mb-2">Metode Pembayaran</p>
            <p className="text-slate-700">{order.payment_method}</p>
          </div>

          {order.payment_method === 'QRIS' && qrisImageUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-3">QRIS Payment</h4>
              <div className="text-center">
                <p className="text-sm text-blue-800 mb-3">Scan kode QRIS untuk pembayaran:</p>
                <img
                  src={qrisImageUrl}
                  alt="QRIS Code"
                  className="w-48 h-48 mx-auto border border-blue-200 rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
            </div>
          )}

          {order.status === 'BELUM BAYAR' && order.payment_method === 'TRANSFER' && paymentMethod && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Bank Transfer Instructions</h4>

              <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                <h5 className="font-medium text-green-900 mb-3">Transfer ke rekening berikut:</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Bank:</span>
                    <span className="font-medium text-green-900">{paymentMethod.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">No. Rekening:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-900">{paymentMethod.account_number}</span>
                      <button
                        onClick={() => copyToClipboard(paymentMethod.account_number || '', 'account')}
                        className="p-1 hover:bg-green-100 rounded transition-colors"
                      >
                        {copied === 'account' ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Atas Nama:</span>
                    <span className="font-medium text-green-900">{paymentMethod.account_holder}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => copyToClipboard(order.total.toString(), 'amount')}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-sm"
                >
                  {copied === 'amount' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>Salin Nominal</span>
                </button>
                <button
                  onClick={() => copyToClipboard(paymentMethod.account_number || '', 'account')}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-sm"
                >
                  {copied === 'account' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>Salin No. Rek</span>
                </button>
              </div>

              <p className="text-xs text-green-600">
                Transfer sesuai nominal yang tertera. Konfirmasi pembayaran setelah transfer berhasil.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}