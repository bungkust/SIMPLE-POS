import { useEffect, useState } from 'react';
import { Filter, CheckCircle, XCircle, ExternalLink, Download, Printer, MessageCircle, Sheet, ShoppingBag, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatDateTime } from '../../lib/utils';
import { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export function OrdersTab() {
  const { currentTenant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    if (currentTenant) {
      loadOrders();
    }
  }, [currentTenant]);

  const loadOrders = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('OrdersTab: Starting to load orders...');
    }
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('OrdersTab: Querying orders table...');
      }

      if (!currentTenant?.id) {
        setOrders([]);
        setOrderItems([]);
        setLoading(false);
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (process.env.NODE_ENV === 'development') {
        console.log('OrdersTab: Orders query result:', { dataLength: ordersData?.length, error: ordersError });
      }

      if (ordersError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('OrdersTab: Orders query failed:', ordersError);
        }
        throw ordersError;
      }

      const orders = ordersData || [];
      if (process.env.NODE_ENV === 'development') {
        console.log('OrdersTab: Orders loaded successfully:', orders.length, 'orders');
      }
      setOrders(orders);

      if (orders.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('OrdersTab: Loading order items for', orders.length, 'orders...');
        }
        const orderIds = orders.map(order => order.id);

        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds)
          .eq('tenant_id', currentTenant.id)
          .order('order_id');

        if (process.env.NODE_ENV === 'development') {
          console.log('OrdersTab: Order items query result:', { dataLength: itemsData?.length, error: itemsError });
        }

        if (itemsError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('OrdersTab: Order items query failed:', itemsError);
          }
          setOrderItems([]);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('OrdersTab: Order items loaded successfully:', itemsData?.length, 'items');
          }
          setOrderItems(itemsData || []);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('OrdersTab: No orders found, setting empty order items');
        }
        setOrderItems([]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('OrdersTab: Error loading orders:', error);
      }
      setOrders([]);
      setOrderItems([]);
    } finally {
      if (process.env.NODE_ENV === 'development') {
        console.log('OrdersTab: Setting loading to false');
      }
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'SUDAH BAYAR' | 'DIBATALKAN') => {
    try {
      // Update the order with tenant_id for activity logging
      // If the order doesn't have a tenant_id but currentTenant exists, set it
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Only set tenant_id if currentTenant exists and order doesn't have one
      if (currentTenant?.id) {
        updateData.tenant_id = currentTenant.id;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      await loadOrders();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating order:', error);
      }
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Error exporting to Google Sheets:', error);
      }
      alert(`❌ Gagal export ke Google Sheets: ${(error as Error).message}\n\nPastikan Google Apps Script sudah di-setup dengan benar.`);
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

  const formatOrderOptions = (orderId: string) => {
    const items = getOrderItemsForOrder(orderId);
    if (items.length === 0) return '-';

    const optionsList = items
      .filter(item => item.notes && item.notes.trim() !== '')
      .map(item => {
        // Parse the notes field which contains formatted options
        // Format: "Size: Large; Sugar Level: Less Sugar; Temperature: Hot"
        if (item.notes.includes(':') && item.notes.includes(';')) {
          // Multiple options format
          return item.notes.split(';').map(opt => opt.trim()).filter(opt => opt.length > 0);
        } else if (item.notes.includes(':')) {
          // Single option format
          return [item.notes];
        } else {
          // Simple note without option format
          return [`Note: ${item.notes}`];
        }
      })
      .flat() // Flatten the array of arrays
      .filter(option => option && option.trim() !== '');

    return optionsList.length > 0 ? optionsList.join('; ') : '-';
  };

  const filteredOrders = orders.filter((order) => {
    if (!filterStatus) return true;
    return order.status === filterStatus;
  });

  // Calculate stats for the header
  const totalOrders = orders.length;
  const paidOrders = orders.filter(order => order.status === 'SUDAH BAYAR').length;
  const pendingOrders = orders.filter(order => order.status === 'BELUM BAYAR').length;
  const cancelledOrders = orders.filter(order => order.status === 'DIBATALKAN').length;
  const totalRevenue = orders.filter(order => order.status === 'SUDAH BAYAR').reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Stats */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingBag className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Orders Management</h2>
            <p className="text-green-100">Kelola dan pantau semua pesanan</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm text-green-100">Total Orders</span>
            </div>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm text-green-100">Paid</span>
            </div>
            <p className="text-2xl font-bold">{paidOrders}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm text-green-100">Pending</span>
            </div>
            <p className="text-2xl font-bold">{pendingOrders}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm text-green-100">Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Filter and Actions Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <label className="text-sm font-medium text-slate-700">Filter Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Semua Status</option>
                <option value="BELUM BAYAR">Belum Bayar</option>
                <option value="SUDAH BAYAR">Sudah Bayar</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </select>
            </div>
            <span className="text-sm text-slate-500">
              Menampilkan {filteredOrders.length} dari {totalOrders} pesanan
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={exportToGoogleSheets}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Sheet className="w-4 h-4" />
              <span className="hidden sm:inline">Export to Sheets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-2">Tidak ada pesanan ditemukan</p>
          <p className="text-slate-400 text-sm">
            {filterStatus ? 'Coba ubah filter status untuk melihat pesanan lain' : 'Belum ada pesanan yang masuk hari ini'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Order Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Options
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Metode Pembayaran
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-25 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{order.order_code}</span>
                        <button
                          onClick={() => window.open(`#invoice-${order.order_code}`, '_blank')}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                          title="Lihat Invoice"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{order.customer_name}</p>
                        <p className="text-sm text-slate-500">{order.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                      <div className="truncate" title={formatOrderItems(order.id)}>
                        {formatOrderItems(order.id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                      <div className="truncate" title={formatOrderOptions(order.id)}>
                        {formatOrderOptions(order.id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                        order.payment_method === 'TRANSFER'
                          ? 'bg-green-100 text-green-700'
                          : order.payment_method === 'QRIS'
                          ? 'bg-blue-100 text-blue-700'
                          : order.payment_method === 'COD'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {order.payment_method === 'TRANSFER' ? 'Transfer' : order.payment_method === 'QRIS' ? 'QRIS' : order.payment_method === 'COD' ? 'COD' : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                          order.status === 'BELUM BAYAR' ? 'bg-orange-100 text-orange-700' :
                          order.status === 'SUDAH BAYAR' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => printReceipt(order)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          title="Cetak Struk"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadReceipt(order)}
                          className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                          title="Download Struk"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendReceiptToWhatsApp(order)}
                          className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                          title="Kirim ke WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        {order.status === 'BELUM BAYAR' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'SUDAH BAYAR')}
                              className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                              title="Tandai Sudah Bayar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'DIBATALKAN')}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
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
