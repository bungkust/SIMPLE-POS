import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatRupiah } from '../lib/utils';

export function CartBar() {
  const navigate = useNavigate();
  const { totalItems, totalAmount } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40 safe-area-pb">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-green-500 text-white py-3 sm:py-4 rounded-lg flex items-center justify-between px-4 sm:px-6 hover:bg-green-600 active:bg-green-700 transition-colors touch-manipulation min-h-[48px]"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-semibold text-sm sm:text-base">{totalItems} Item{totalItems > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-bold text-sm sm:text-base">{formatRupiah(totalAmount)}</span>
            <span className="text-xs sm:text-sm font-medium">Checkout →</span>
          </div>
        </button>
      </div>
    </div>
  );
}