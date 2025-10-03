import { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Discount = Database['public']['Tables']['menu_discounts']['Row'];
// type MenuOption = Database['public']['Tables']['menu_options']['Row']; // Commented out - no longer needed

interface MenuCardProps {
  item: MenuItem;
  onClick: () => void;
}

export function MenuCard({ item, onClick }: MenuCardProps) {
  const [discount, setDiscount] = useState<Discount | null>(null);
  // const [options, setOptions] = useState<MenuOption[]>([]); // Commented out - no longer needed

  useEffect(() => {
    if (item.discount_id) {
      loadDiscount();
    }
    // loadOptions(); // Commented out - no longer needed
  }, [item.id]);

  const loadDiscount = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_discounts')
        .select('*')
        .eq('id', item.discount_id!)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (data) setDiscount(data);
    } catch (error) {
      console.error('Error loading discount:', error);
    }
  };

  // const loadOptions = async () => {
  //   try {
  //     const { data, error } = await supabase
  //       .from('menu_options')
  //       .select('*')
  //       .eq('menu_item_id', item.id)
  //       .order('sort_order');

  //     if (error) throw error;
  //     if (data) setOptions(data);
  //   } catch (error) {
  //     console.error('Error loading options:', error);
  //   }
  // };

  const calculateDiscountedPrice = () => {
    if (!discount || !item.base_price) return item.price;

    if (discount.discount_type === 'percentage') {
      return item.base_price * (1 - discount.discount_value / 100);
    } else {
      return Math.max(0, item.base_price - discount.discount_value);
    }
  };

  const discountedPrice = calculateDiscountedPrice();
  // const hasOptions = options.length > 0; // Commented out - no longer needed

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer text-left w-full"
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

        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {discount.discount_type === 'percentage'
              ? `-${discount.discount_value}%`
              : `-${formatRupiah(discount.discount_value)}`
            }
          </div>
        )}

        {/* Badge Section - Hidden as requested */}
        {/* {hasOptions ? (
          <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Custom
          </div>
        ) : (
          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Ready
          </div>
        )} */}
      </div>

      <div className="p-4">
        {/* Product Name & Description */}
        <div className="mb-3">
          <h3 className="font-semibold text-slate-900 mb-1">{item.name}</h3>
          {item.short_description && (
            <p className="text-sm text-slate-600 line-clamp-2">
              {item.short_description}
            </p>
          )}
        </div>

        {/* Price Section */}
        <div className="mb-3">
          {discount && item.base_price !== discountedPrice ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 line-through text-sm">
                {formatRupiah(item.base_price)}
              </span>
              <span className="text-green-600 font-bold">
                {formatRupiah(discountedPrice)}
              </span>
            </div>
          ) : (
            <span className="text-green-600 font-bold">
              {formatRupiah(item.price)}
            </span>
          )}
        </div>

        {/* Menu Type Info - Hidden as requested */}
        {/* {hasOptions ? (
          <div className="flex flex-wrap gap-1">
            {options.slice(0, 2).map((option) => (
              <span
                key={option.id}
                className="inline-block bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs border border-blue-200"
              >
                {option.label}
              </span>
            ))}
            {options.length > 2 && (
              <span className="inline-block bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs border border-blue-200">
                +{options.length - 2} lagi
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="inline-block bg-green-50 text-green-600 px-2 py-1 rounded text-xs border border-green-200">
              Siap pesan
            </span>
          </div>
        )} */}

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors touch-manipulation"
        >
          Order
        </button>
      </div>
    </div>
  );
}