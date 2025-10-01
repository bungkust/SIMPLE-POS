import { formatRupiah } from '../lib/utils';
import { Database } from '../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface MenuCardProps {
  item: MenuItem;
  onClick: () => void;
}

export function MenuCard({ item, onClick }: MenuCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow text-left w-full"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-slate-400 text-sm">No image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-slate-600 mb-2 line-clamp-2">{item.description}</p>
        )}
        <p className="text-green-600 font-bold">{formatRupiah(item.price)}</p>
      </div>
    </button>
  );
}