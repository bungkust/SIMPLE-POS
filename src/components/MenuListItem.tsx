import { Plus } from 'lucide-react';
import { formatRupiah } from '../lib/utils';
import { Database } from '../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface MenuListItemProps {
  item: MenuItem;
  onClick: () => void;
}

export function MenuListItem({ item, onClick }: MenuListItemProps) {
  return (
    <div className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 min-h-[96px]">
      {/* Thumbnail - 80x80px, 1:1 ratio, 16px radius */}
      <div className="w-20 h-20 flex-shrink-0">
        <div className="w-full h-full bg-slate-100 rounded-xl overflow-hidden">
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-slate-400 text-xs">No image</span>
            </div>
          )}
        </div>
      </div>

      {/* Content - Vertical stack */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-900 text-base line-clamp-1">
          {item.name}
        </h3>
        {item.short_description && (
          <p className="text-sm text-slate-600 line-clamp-1 mt-0.5">
            {item.short_description}
          </p>
        )}
        <div className="mt-1">
          <span className="text-green-600 font-bold text-base">
            {formatRupiah(item.price)}
          </span>
        </div>
      </div>

      {/* CTA Button - 48px circular, brand green, vertically centered */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-colors touch-manipulation"
        aria-label={`Add ${item.name} to cart`}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
