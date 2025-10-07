import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRupiah, formatDateTime, normalizePhone } from '../lib/utils';
import { Database } from '../lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

interface OrderHistoryPageProps {
  onBack: () => void;
  onViewInvoice: (orderCode: string) => void;
}

export function OrderHistoryPage({ onBack, onViewInvoice }: OrderHistoryPageProps) {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const normalizedPhone = normalizePhone(phone);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('phone', normalizedPhone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading orders:', error);
      }
      alert('Gagal memuat riwayat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    'BELUM BAYAR': 'bg-orange-100 text-orange-700',
    'SUDAH BAYAR': 'bg-green-100 text-green-700',
    'DIBATALKAN': 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Riwayat Pesanan</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Masukkan Nomor HP Anda
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Mencari...' : 'Cari'}
              </button>
            </div>
          </form>
        </div>

        {searched && (
          <div>
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-slate-600">Tidak ada pesanan ditemukan</p>
                <p className="text-sm text-slate-500 mt-2">
                  Pastikan nomor HP yang Anda masukkan sudah benar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => onViewInvoice(order.order_code)}
                    className="w-full bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{order.order_code}</p>
                        <p className="text-sm text-slate-600">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="text-sm text-slate-600">
                        <p>Ambil: {order.pickup_date}</p>
                        <p>{order.payment_method}</p>
                      </div>
                      <p className="font-bold text-green-600">{formatRupiah(order.total)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}