import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { Database } from '../lib/database.types';
import { formatRupiah } from '../lib/utils';
import { useCart } from '../contexts/CartContext';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface MenuDetailModalProps {
  item: MenuItem;
  onClose: () => void;
}

export function MenuDetailModal({ item, onClose }: MenuDetailModalProps) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      qty,
      notes: notes || undefined,
      photo_url: item.photo_url,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-lg text-slate-900">Detail Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {item.photo_url && (
            <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4">
              <img
                src={item.photo_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h3 className="text-xl font-bold text-slate-900 mb-2">{item.name}</h3>
          {item.description && (
            <p className="text-slate-600 mb-4">{item.description}</p>
          )}
          <p className="text-2xl font-bold text-green-600 mb-6">{formatRupiah(item.price)}</p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                disabled={qty <= 1}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-xl font-semibold w-12 text-center">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Less sugar, extra ice"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Tambah ke Keranjang - {formatRupiah(item.price * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}