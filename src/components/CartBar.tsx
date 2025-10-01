import { ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatRupiah } from '../lib/utils';

interface CartBarProps {
  onCheckout: () => void;
}

export function CartBar({ onCheckout }: CartBarProps) {
  const { totalItems, totalAmount } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <button
          onClick={onCheckout}
          className="w-full bg-green-500 text-white py-3 rounded-lg flex items-center justify-between px-4 hover:bg-green-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold">{totalItems} Item</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold">{formatRupiah(totalAmount)}</span>
            <span className="text-sm">Checkout →</span>
          </div>
        </button>
      </div>
    </div>
  );
}