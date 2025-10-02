import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Download, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRupiah, formatDateTime } from '../lib/utils';
import { Database } from '../lib/database.types';
import jsPDF from 'jspdf';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

interface InvoicePageProps {
  orderCode: string;
  onBack: () => void;
}

export function InvoicePage({ orderCode, onBack }: InvoicePageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
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

  const paymentInfo = import.meta.env.VITE_PAYMENT_INFO_TEXT || '';
  const qrisUrl = import.meta.env.VITE_QRIS_IMAGE_URL || '';

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

          {order.status === 'BELUM BAYAR' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">Instruksi Pembayaran</h4>
              {paymentInfo && <p className="text-sm text-orange-800 mb-3">{paymentInfo}</p>}

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => copyToClipboard(order.total.toString(), 'amount')}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-sm"
                >
                  {copied === 'amount' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>Salin Nominal</span>
                </button>
              </div>

              {qrisUrl && (
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">Scan QRIS:</p>
                  <img
                    src={qrisUrl}
                    alt="QRIS Code"
                    className="w-48 h-48 mx-auto border border-slate-200 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}