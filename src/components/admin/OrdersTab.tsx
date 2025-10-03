import { useEffect, useState } from 'react';
import { Filter, CheckCircle, XCircle, ExternalLink, Download, Printer, MessageCircle, Sheet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatDateTime } from '../../lib/utils';
import { Database } from '../../lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const orders = ordersData || [];
      setOrders(orders);

      if (orders.length > 0) {
        const orderIds = orders.map(order => order.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds)
          .order('order_id');

        if (itemsError) {
          console.error('Error loading order items:', itemsError);
          setOrderItems([]);
        } else {
          setOrderItems(itemsData || []);
        }
      } else {
        setOrderItems([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'SUDAH BAYAR' | 'DIBATALKAN') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      await loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Gagal mengupdate status pesanan');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Order Code',
      'Tanggal',
      'Nama',
      'HP',
      'Pesanan',
      'Total',
      'Metode',
      'Status',
    ];

    const rows = filteredOrders.map((order) => [
      order.order_code,
      formatDateTime(order.created_at),
      order.customer_name,
      order.phone,
      formatOrderItems(order.id),
      order.total,
      order.payment_method,
      order.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReceipt = (order: Order) => {
    const items = getOrderItemsForOrder(order.id);

    const receiptContent = `
${'='.repeat(32)}
        KOPI PENDEKAR
${'='.repeat(32)}

Order: ${order.order_code}
Tanggal: ${formatDateTime(order.created_at)}
Nama: ${order.customer_name}
HP: ${order.phone}

${'-'.repeat(32)}
DAFTAR PESANAN:
${'-'.repeat(32)}
${items.map(item => `${item.name_snapshot}
${item.qty}x @${formatRupiah(item.price_snapshot)} = ${formatRupiah(item.line_total)}`).join('\n\n')}

${'-'.repeat(32)}
TOTAL: ${formatRupiah(order.total)}
Status: ${order.status}
${'-'.repeat(32)}

Terima kasih atas pesanan Anda!

Printed: ${new Date().toLocaleString('id-ID')}
${'='.repeat(32)}
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${order.order_code}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; padding: 3mm; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.3;
              margin: 0;
              padding: 8px;
              width: 80mm;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
${receiptContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadReceipt = (order: Order) => {
    const items = getOrderItemsForOrder(order.id);

    const receiptContent = `
${'='.repeat(32)}
        KOPI PENDEKAR
${'='.repeat(32)}

Order: ${order.order_code}
Tanggal: ${formatDateTime(order.created_at)}
Nama: ${order.customer_name}
HP: ${order.phone}

${'-'.repeat(32)}
DAFTAR PESANAN:
${'-'.repeat(32)}
${items.map(item => `${item.name_snapshot}
${item.qty}x @${formatRupiah(item.price_snapshot)} = ${formatRupiah(item.line_total)}`).join('\n\n')}

${'-'.repeat(32)}
TOTAL: ${formatRupiah(order.total)}
Status: ${order.status}
${'-'.repeat(32)}

Terima kasih atas pesanan Anda!

Downloaded: ${new Date().toLocaleString('id-ID')}
${'='.repeat(32)}
    `;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Canvas not supported in this browser');
      return;
    }

    canvas.width = 640;
    canvas.height = 800;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';

    const lines = receiptContent.trim().split('\n');
    let y = 30;

    lines.forEach(line => {
      if (line.includes('=')) {
        ctx.font = 'bold 16px monospace';
      } else if (line.includes('-')) {
        ctx.font = '14px monospace';
      } else if (line.includes('Rp') || line.includes('TOTAL')) {
        ctx.font = 'bold 16px monospace';
      } else {
        ctx.font = '14px monospace';
      }

      ctx.fillText(line, 15, y);
      y += 22;
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${order.order_code}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/jpeg', 0.9);
  };

  const sendReceiptToWhatsApp = (order: Order) => {
    const items = getOrderItemsForOrder(order.id);

    const messageContent = `🧾 STRUK PESANAN KOPI PENDEKAR

==============================
        KOPI PENDEKAR
==============================

📋 Order: ${order.order_code}
📅 Tanggal: ${formatDateTime(order.created_at)}
👤 Nama: ${order.customer_name}
📱 HP: ${order.phone}

------------------------------
🍰 DAFTAR PESANAN:
------------------------------
${items.map(item => `• ${item.name_snapshot}
  ${item.qty}x @${formatRupiah(item.price_snapshot)} = ${formatRupiah(item.line_total)}`).join('\n\n')}

------------------------------
💰 TOTAL: ${formatRupiah(order.total)}
💳 Status: ${order.status}
------------------------------

Terima kasih atas pesanan Anda! ☕

Best regards,
Kopi Pendekar Team`;

    const phoneNumber = order.phone.replace(/^\+/, '');
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageContent)}`;
    window.open(whatsappURL, '_blank');
  };

  const exportToGoogleSheets = async () => {
    try {
      const sheetData = filteredOrders.map((order) => {
        const items = getOrderItemsForOrder(order.id);
        return {
          order_code: order.order_code,
          created_at: formatDateTime(order.created_at),
          customer_name: order.customer_name,
          phone: order.phone,
          items: items.map(item => `${item.name_snapshot} (${item.qty}x)`).join('; '),
          total: order.total,
          payment_method: order.payment_method,
          status: order.status,
          exported_at: new Date().toISOString(),
        };
      });

      const response = await fetch(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'exportOrders',
          data: sheetData,
          sheetName: 'Orders',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(`✅ Data berhasil di-export ke Google Sheets!\n📊 ${filteredOrders.length} orders telah di-sync.`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      alert(`❌ Gagal export ke Google Sheets: ${error.message}\n\nPastikan Google Apps Script sudah di-setup dengan benar.`);
    }
  };

  const getOrderItemsForOrder = (orderId: string) => {
    return orderItems.filter(item => item.order_id === orderId);
  };

  const formatOrderItems = (orderId: string) => {
    const items = getOrderItemsForOrder(orderId);
    if (items.length === 0) return 'Tidak ada item';

    return items.map(item =>
      `${item.name_snapshot} (${item.qty}x) - ${formatRupiah(item.line_total)}`
    ).join(', ');
  };

  const filteredOrders = orders.filter((order) => {
    if (!filterStatus) return true;
    return order.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Semua Status</option>
            <option value="BELUM BAYAR">Belum Bayar</option>
            <option value="SUDAH BAYAR">Sudah Bayar</option>
            <option value="DIBATALKAN">Dibatalkan</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportToGoogleSheets}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Sheet className="w-4 h-4" />
            <span>Export to Sheets</span>
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-600">Tidak ada pesanan</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Order Code
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    HP
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Pesanan
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Metode
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{order.order_code}</span>
                        <button
                          onClick={() => window.open(`#invoice-${order.order_code}`, '_blank')}
                          className="p-1 hover:bg-slate-200 rounded"
                          title="Lihat Invoice"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">{order.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{order.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate" title={formatOrderItems(order.id)}>
                      {formatOrderItems(order.id)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{order.payment_method}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'BELUM BAYAR' ? 'bg-orange-100 text-orange-700' :
                          order.status === 'SUDAH BAYAR' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => printReceipt(order)}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Cetak Struk"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadReceipt(order)}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="Download Struk"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendReceiptToWhatsApp(order)}
                          className="p-1 hover:bg-emerald-100 rounded text-emerald-600"
                          title="Kirim ke WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        {order.status === 'BELUM BAYAR' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'SUDAH BAYAR')}
                              className="p-1 hover:bg-green-100 rounded text-green-600"
                              title="Tandai Sudah Bayar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'DIBATALKAN')}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                              title="Batalkan"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
