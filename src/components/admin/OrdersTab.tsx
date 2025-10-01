import { useEffect, useState } from 'react';
import { Filter, CheckCircle, XCircle, ExternalLink, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatDateTime } from '../../lib/utils';
import { Database } from '../../lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
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
      'Tanggal Ambil',
      'Total',
      'Metode',
      'Status',
    ];

    const rows = filteredOrders.map((order) => [
      order.order_code,
      formatDateTime(order.created_at),
      order.customer_name,
      order.phone,
      order.pickup_date,
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

  const filteredOrders = orders.filter((order) => {
    if (!filterStatus) return true;
    return order.status === filterStatus;
  });

  const statusColors = {
    'BELUM BAYAR': 'bg-orange-100 text-orange-700',
    'SUDAH BAYAR': 'bg-green-100 text-green-700',
    'DIBATALKAN': 'bg-red-100 text-red-700',
  };

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

        <button
          onClick={exportToCSV}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
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
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{order.payment_method}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
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