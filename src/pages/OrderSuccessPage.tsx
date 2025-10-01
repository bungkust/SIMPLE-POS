import { CheckCircle } from 'lucide-react';

interface OrderSuccessPageProps {
  orderCode: string;
  onViewInvoice: () => void;
  onBackToMenu: () => void;
}

export function OrderSuccessPage({ orderCode, onViewInvoice, onBackToMenu }: OrderSuccessPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Pesanan Berhasil Dibuat!</h1>
        <p className="text-slate-600 mb-6">
          Pesanan Anda dengan kode <span className="font-semibold">{orderCode}</span> telah berhasil
          dibuat.
        </p>

        <div className="space-y-3">
          <button
            onClick={onViewInvoice}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Lihat Invoice
          </button>
          <button
            onClick={onBackToMenu}
            className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  );
}