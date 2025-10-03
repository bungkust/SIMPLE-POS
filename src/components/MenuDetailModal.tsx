import { useState, useEffect } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { formatRupiah } from '../lib/utils';
import { useCart } from '../contexts/CartContext';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Discount = Database['public']['Tables']['menu_discounts']['Row'];
type MenuOption = Database['public']['Tables']['menu_options']['Row'];
type MenuOptionItem = Database['public']['Tables']['menu_option_items']['Row'];

interface SelectedOption {
  optionId: string;
  optionName: string;
  selectedItems: {
    itemId: string;
    itemName: string;
    additionalPrice: number;
  }[];
}

interface MenuDetailModalProps {
  item: MenuItem;
  onClose: () => void;
}

export function MenuDetailModal({ item, onClose }: MenuDetailModalProps) {
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [options, setOptions] = useState<MenuOption[]>([]);
  const [optionItems, setOptionItems] = useState<MenuOptionItem[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Add quantity and notes state
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  const { addItem } = useCart();

  useEffect(() => {
    loadData();
  }, [item.id]);

  const loadData = async () => {
    try {
      // Load discount
      if (item.discount_id) {
        const { data: discountData, error: discountError } = await supabase
          .from('menu_discounts')
          .select('*')
          .eq('id', item.discount_id)
          .eq('is_active', true)
          .single();

        if (discountError) {
          console.error('Error loading discount:', discountError);
        } else if (discountData) {
          setDiscount(discountData);
        }
      }

      // Load options
      const { data: optionsData, error: optionsError } = await supabase
        .from('menu_options')
        .select('*')
        .eq('menu_item_id', item.id)
        .order('sort_order');

      if (optionsError) {
        console.error('Error loading options:', optionsError);
        // Don't throw error, just log it - options might not exist yet
        setOptions([]);
      } else if (optionsData) {
        setOptions(optionsData);

        // Load option items for all options
        const optionIds = optionsData.map(opt => opt.id);
        if (optionIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('menu_option_items')
            .select('*')
            .in('menu_option_id', optionIds)
            .eq('is_available', true)
            .order('sort_order');

          if (itemsError) {
            console.error('Error loading option items:', itemsError);
            setOptionItems([]);
          } else if (itemsData) {
            setOptionItems(itemsData);
          }
        }
      } else {
        setOptions([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays to prevent crashes
      setOptions([]);
      setOptionItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getBasePrice = () => {
    return item.base_price || item.price;
  };

  const calculateDiscountedPrice = (basePrice: number) => {
    if (!discount) return basePrice;

    if (discount.discount_type === 'percentage') {
      return basePrice * (1 - discount.discount_value / 100);
    } else {
      return Math.max(0, basePrice - discount.discount_value);
    }
  };

  const calculateTotalPrice = () => {
    let total = getBasePrice();

    selectedOptions.forEach(selectedOption => {
      selectedOption.selectedItems.forEach(selectedItem => {
        total += selectedItem.additionalPrice;
      });
    });

    // Apply discount to the base total
    const discountedTotal = calculateDiscountedPrice(total);

    // Multiply by quantity
    return discountedTotal * qty;
  };

  const handleOptionSelection = (option: MenuOption, optionItem: MenuOptionItem, isSelected: boolean) => {
    setSelectedOptions(prev => {
      const existingOptionIndex = prev.findIndex(opt => opt.optionId === option.id);

      if (existingOptionIndex >= 0) {
        const existingOption = prev[existingOptionIndex];

        if (option.selection_type === 'single_required' || option.selection_type === 'single_optional') {
          // Single selection - replace
          const newOption = {
            ...existingOption,
            selectedItems: isSelected ? [{
              itemId: optionItem.id,
              itemName: optionItem.name,
              additionalPrice: optionItem.additional_price
            }] : []
          };

          const newOptions = [...prev];
          newOptions[existingOptionIndex] = newOption;
          return newOptions;
        } else {
          // Multiple selection
          const newItems = isSelected
            ? [...existingOption.selectedItems, {
                itemId: optionItem.id,
                itemName: optionItem.name,
                additionalPrice: optionItem.additional_price
              }]
            : existingOption.selectedItems.filter(item => item.itemId !== optionItem.id);

          const newOption = {
            ...existingOption,
            selectedItems: newItems
          };

          const newOptions = [...prev];
          newOptions[existingOptionIndex] = newOption;
          return newOptions;
        }
      } else {
        // New option
        if (isSelected) {
          return [...prev, {
            optionId: option.id,
            optionName: option.label,
            selectedItems: [{
              itemId: optionItem.id,
              itemName: optionItem.name,
              additionalPrice: optionItem.additional_price
            }]
          }];
        }
        return prev;
      }
    });
  };

  const isItemSelected = (optionId: string, itemId: string) => {
    const option = selectedOptions.find(opt => opt.optionId === optionId);
    return option?.selectedItems.some(item => item.itemId === itemId) || false;
  };

  const getSelectedItemsForOption = (optionId: string) => {
    const option = selectedOptions.find(opt => opt.optionId === optionId);
    return option?.selectedItems || [];
  };

  const getOptionItemsForOption = (optionId: string) => {
    return optionItems.filter(item => item.menu_option_id === optionId);
  };

  const handleAddToCart = () => {
    // Validate required options if any exist
    const requiredOptions = options.filter(opt => opt.is_required);
    const hasAllRequired = requiredOptions.every(opt => {
      const selectedItems = getSelectedItemsForOption(opt.id);
      return selectedItems.length > 0;
    });

    if (requiredOptions.length > 0 && !hasAllRequired) {
      alert('Please select all required options');
      return;
    }

    const totalPrice = calculateTotalPrice();

    // Create cart item with all details
    const cartItem = {
      id: item.id,
      name: item.name,
      price: totalPrice / qty, // Price per item (excluding quantity multiplier)
      qty: qty,
      notes: notes || undefined,
      photo_url: item.photo_url,
    };

    // Add to cart using the context
    addItem(cartItem);
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center sm:justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Detail Menu
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Hero Image */}
          {item.photo_url && (
            <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4">
              <img
                src={item.photo_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Product Name & Description */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{item.name}</h3>
            {item.short_description && (
              <p className="text-slate-600 text-sm mb-3">{item.short_description}</p>
            )}
          </div>

          {/* Price Display */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              {discount && getBasePrice() !== calculateDiscountedPrice(getBasePrice()) ? (
                <>
                  <span className="text-slate-400 line-through">
                    {formatRupiah(getBasePrice())}
                  </span>
                  <span className="text-green-600 font-bold text-lg">
                    {formatRupiah(calculateDiscountedPrice(getBasePrice()))}
                  </span>
                  {discount.discount_type === 'percentage' ? (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                      -{discount.discount_value}%
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                      -{formatRupiah(discount.discount_value)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-green-600 font-bold text-lg">
                  {formatRupiah(getBasePrice())}
                </span>
              )}
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors touch-manipulation"
                disabled={qty <= 1}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-xl font-semibold w-12 text-center">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors touch-manipulation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Less sugar, extra ice"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none touch-manipulation"
              rows={3}
            />
          </div>

          {/* Options Section - Only show if item has options */}
          {options.length > 0 && (
            <div className="space-y-6">
              <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Customize Options</h4>

              {options.map((option) => {
                const optionItemsForOption = getOptionItemsForOption(option.id);
                const selectedItems = getSelectedItemsForOption(option.id);

                return (
                  <div key={option.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-slate-900">
                        {option.label}
                        {option.is_required && <span className="text-red-500 ml-1">*</span>}
                      </h5>
                      {option.selection_type === 'multiple' && (
                        <span className="text-sm text-slate-500">
                          Select up to {option.max_selections}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {optionItemsForOption.map((optionItem) => {
                        const isSelected = isItemSelected(option.id, optionItem.id);
                        const isDisabled = option.selection_type === 'multiple' &&
                          !isSelected && selectedItems.length >= option.max_selections;

                        return (
                          <label
                            key={optionItem.id}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-green-500 bg-green-50'
                                : isDisabled
                                  ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                                  : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type={
                                  option.selection_type === 'multiple' ? 'checkbox' : 'radio'
                                }
                                name={`option-${option.id}`}
                                checked={isSelected}
                                disabled={isDisabled && !isSelected}
                                onChange={(e) => handleOptionSelection(option, optionItem, e.target.checked)}
                                className="w-4 h-4 text-green-500 focus:ring-green-500"
                              />
                              <span className="font-medium">{optionItem.name}</span>
                            </div>

                            {optionItem.additional_price > 0 && (
                              <span className="text-green-600 font-medium">
                                +{formatRupiah(optionItem.additional_price)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-slate-900">Total:</span>
            <span className="text-xl font-bold text-green-600">
              {formatRupiah(calculateTotalPrice())}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors touch-manipulation font-semibold"
          >
            Add to Cart - {formatRupiah(calculateTotalPrice())}
          </button>
        </div>
      </div>
    </div>
  );
}