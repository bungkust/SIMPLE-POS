import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Search, FileText, Calendar, Phone, Package } from 'lucide-react';
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
    'BELUM BAYAR': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'SUDAH BAYAR': 'bg-green-100 text-green-800 border-green-200',
    'SEDANG DISIAPKAN': 'bg-blue-100 text-blue-800 border-blue-200',
    'SIAP DIAMBIL': 'bg-purple-100 text-purple-800 border-purple-200',
    'SELESAI': 'bg-gray-100 text-gray-800 border-gray-200',
    'DIBATALKAN': 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Professional Header */}
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
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Riwayat Pesanan</h1>
              <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
                Cari pesanan Anda dengan nomor telepon
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
                <Package className="w-6 h-6 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <h1 className="text-lg sm:text-3xl font-bold mb-1 sm:mb-2">Riwayat Pesanan</h1>
              <p className="text-sm sm:text-lg opacity-90">
                Cari dan lihat riwayat pesanan Anda
              </p>
            </div>
          </div>

          <CardHeader className="pb-3 sm:pb-6 pt-3 sm:pt-8">
            <div className="text-center">
              <h2 className="text-sm sm:text-xl font-semibold mb-1">Cari Pesanan</h2>
              <p className="text-muted-foreground text-xs sm:text-base">Masukkan nomor telepon untuk melihat riwayat pesanan</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 sm:space-y-8 p-3 sm:p-6">
            {/* Search Form */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  <Search className="w-3 h-3 sm:w-5 sm:h-5" />
                  Cari Riwayat Pesanan
                </CardTitle>
                <CardDescription className="text-xs sm:text-base">
                  Masukkan nomor telepon yang digunakan saat memesan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-2 sm:space-y-4">
                  <div className="flex gap-2 sm:gap-4">
                    <Input
                      type="tel"
                      placeholder="Masukkan nomor telepon (contoh: 081234567890)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 text-xs sm:text-base"
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      disabled={loading || !phone.trim()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                          Mencari...
                        </>
                      ) : (
                        <>
                          <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Cari
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            {searched && (
              <div className="space-y-3 sm:space-y-6">
                <div className="text-center">
                  <h3 className="text-sm sm:text-lg font-semibold mb-2">
                    {orders.length > 0 ? `Ditemukan ${orders.length} pesanan` : 'Tidak ada pesanan ditemukan'}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-base">
                    {orders.length > 0 
                      ? 'Berikut adalah riwayat pesanan Anda' 
                      : 'Coba periksa kembali nomor telepon yang Anda masukkan'
                    }
                  </p>
                </div>

                {orders.length > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-3 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <Badge className={`${statusColors[order.status as keyof typeof statusColors]} text-xs sm:text-sm`}>
                                  {order.status}
                                </Badge>
                                <span className="font-bold text-sm sm:text-lg">{order.order_code}</span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>{formatDateTime(order.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>{order.phone}</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>Ambil: {order.pickup_date}</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="font-semibold text-foreground">
                                    Total: {formatRupiah(order.total)}
                                  </span>
                                </div>
                              </div>
                              
                              {order.notes && (
                                <div className="mt-2 p-2 bg-muted/50 rounded text-xs sm:text-sm">
                                  <span className="font-medium">Catatan:</span> {order.notes}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => onViewInvoice(order.order_code || '')}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm"
                                size="sm"
                              >
                                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                Lihat Invoice
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Professional Footer */}
            <Card className="bg-gradient-to-r from-muted/30 to-muted/50 border-0 mt-3 sm:mt-8">
              <CardContent className="text-center py-3 sm:py-6">
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground">Butuh Bantuan?</h3>
                  <p className="text-muted-foreground text-xs sm:text-base">
                    Jika Anda mengalami kesulitan menemukan pesanan, silakan hubungi customer service kami.
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
