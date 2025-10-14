import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { formatRupiah } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [item.id]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 MenuDetailModal: selectedOptions changed:', selectedOptions);
    }
  }, [selectedOptions]);

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
          if (process.env.NODE_ENV === 'development') {
            console.error('Error loading discount:', discountError);
          }
        } else if (discountData) {
          setDiscount(discountData);
        }
      }

      // Load options
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 MenuDetailModal: Loading options for menu item:', item.id, item.name);
      }
      const { data: optionsData, error: optionsError } = await supabase
        .from('menu_options')
        .select('*')
        .eq('menu_item_id', item.id)
        .order('sort_order');

      if (process.env.NODE_ENV === 'development') {
        console.log('📊 MenuDetailModal: Options query result:', { optionsData, optionsError });
      }

      if (optionsError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ MenuDetailModal: Error loading options:', optionsError);
        }
        // Don't throw error, just log it - options might not exist yet
        setOptions([]);
      } else if (optionsData) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ MenuDetailModal: Loaded options:', optionsData.length, optionsData);
          console.log('📋 MenuDetailModal: Options details:', optionsData.map((opt: MenuOption) => ({
            id: opt.id,
            label: opt.label,
            selection_type: opt.selection_type,
            is_required: opt.is_required,
            max_selections: opt.max_selections
          })));
        }
        setOptions(optionsData);

        // Load option items for all options
        const optionIds = optionsData.map((opt: MenuOption) => opt.id);
        if (optionIds.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 MenuDetailModal: Loading option items for option IDs:', optionIds);
          }
          const { data: itemsData, error: itemsError } = await supabase
            .from('menu_option_items')
            .select('*')
            .in('menu_option_id', optionIds)
            .eq('is_available', true)
            .order('sort_order');

          if (process.env.NODE_ENV === 'development') {
            console.log('📊 MenuDetailModal: Option items query result:', { itemsData, itemsError });
          }

          if (itemsError) {
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ MenuDetailModal: Error loading option items:', itemsError);
            }
            setOptionItems([]);
          } else if (itemsData) {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ MenuDetailModal: Loaded option items:', itemsData.length, itemsData);
              console.log('📦 MenuDetailModal: Option items details:', itemsData.map((item: MenuOptionItem) => ({
                id: item.id,
                menu_option_id: item.menu_option_id,
                name: item.name,
                additional_price: item.additional_price
              })));
            }
            setOptionItems(itemsData);
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️ MenuDetailModal: No option IDs to load items for');
          }
          setOptionItems([]);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('ℹ️ MenuDetailModal: No options data returned');
        }
        setOptions([]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ MenuDetailModal: Error loading data:', error);
      }
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
    if (process.env.NODE_ENV === 'development') {
      console.log('🔘 handleOptionSelection:', {
        option: option.label,
        optionItem: optionItem.name,
        isSelected,
        currentSelectedOptions: selectedOptions
      });
    }

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

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ handleOptionSelection: Updated single option:', newOptions);
          }
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

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ handleOptionSelection: Updated multiple option:', newOptions);
          }
          return newOptions;
        }
      } else {
        // New option
        if (isSelected) {
          const newOption = {
            optionId: option.id,
            optionName: option.label,
            selectedItems: [{
              itemId: optionItem.id,
              itemName: optionItem.name,
              additionalPrice: optionItem.additional_price
            }]
          };

          const newOptions = [...prev, newOption];

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ handleOptionSelection: Added new option:', newOptions);
          }
          return newOptions;
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
    if (process.env.NODE_ENV === 'development') {
      console.log('🛒 handleAddToCart: selectedOptions:', selectedOptions);
      console.log('📝 handleAddToCart: user notes:', notes);
    }

    // Validate required options if any exist
    const requiredOptions = options.filter(opt => opt.is_required);
    const hasAllRequired = requiredOptions.every(opt => {
      const selectedItems = getSelectedItemsForOption(opt.id);
      return selectedItems.length > 0;
    });

    if (requiredOptions.length > 0 && !hasAllRequired) {
      toast({
        title: "Required Options Missing",
        description: "Please select all required options before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    const totalPrice = calculateTotalPrice();

    // Format selected options into a readable string
    const formatSelectedOptions = () => {
      if (selectedOptions.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ handleAddToCart: No selectedOptions found');
        }
        return '';
      }

      const optionStrings = selectedOptions.map(option => {
        const itemNames = option.selectedItems.map(item => item.itemName).join(', ');
        return `${option.optionName}: ${itemNames}`;
      });

      const result = optionStrings.join('; ');
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ handleAddToCart: Formatted options:', result);
      }
      return result;
    };

    // Separate selected options from user notes
    const selectedOptionsText = formatSelectedOptions();
    
    // Structure the notes properly: options first, then user notes
    let structuredNotes = '';
    if (selectedOptionsText) {
      structuredNotes = `OPTIONS:${selectedOptionsText}`;
    }
    if (notes && notes.trim()) {
      if (structuredNotes) {
        structuredNotes += `; USER_NOTES:${notes}`;
      } else {
        structuredNotes = `USER_NOTES:${notes}`;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 handleAddToCart: Selected options:', selectedOptionsText);
      console.log('🎯 handleAddToCart: User notes:', notes);
      console.log('🎯 handleAddToCart: Structured notes:', structuredNotes);
    }

    // Create cart item with all details
    const cartItem = {
      id: item.id,
      name: item.name,
      price: totalPrice / qty, // Price per item (excluding quantity multiplier)
      qty: qty,
      notes: structuredNotes || undefined,
      photo_url: item.photo_url,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('🛒 handleAddToCart: Creating cart item:', cartItem);
    }

    // Add to cart using the context
    addItem(cartItem);
    
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart.`,
    });
    
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold">
            Detail Menu
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
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
            <h3 className="text-xl font-bold mb-2">{item.name}</h3>
            {item.short_description && (
              <p className="text-muted-foreground text-sm mb-3">{item.short_description}</p>
            )}
          </div>

          {/* Price Display */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              {discount && getBasePrice() !== calculateDiscountedPrice(getBasePrice()) ? (
                <>
                  <span className="text-muted-foreground line-through">
                    {formatRupiah(getBasePrice())}
                  </span>
                  <span className="text-primary font-bold text-lg">
                    {formatRupiah(calculateDiscountedPrice(getBasePrice()))}
                  </span>
                  {discount.discount_type === 'percentage' ? (
                    <Badge variant="destructive">
                      -{discount.discount_value}%
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      -{formatRupiah(discount.discount_value)}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-primary font-bold text-lg">
                  {formatRupiah(getBasePrice())}
                </span>
              )}
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2">Jumlah</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                className="w-10 h-10"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-xl font-semibold w-12 text-center">{qty}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Options Section - Only show if item has options */}
          {options.length > 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-semibold">Customize Options</h4>
                <Separator />
              </div>

              {options.map((option) => {
                const optionItemsForOption = getOptionItemsForOption(option.id);
                const selectedItems = getSelectedItemsForOption(option.id);

                if (process.env.NODE_ENV === 'development') {
                  console.log('🎯 MenuDetailModal: Rendering option:', option.label, 'with items:', optionItemsForOption.length);
                }

                return (
                  <Card key={option.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold">
                        {option.label}
                        {option.is_required && <span className="text-destructive ml-1">*</span>}
                      </h5>
                      {option.selection_type === 'multiple' && (
                        <span className="text-sm text-muted-foreground">
                          Select up to {option.max_selections}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {optionItemsForOption.length > 0 ? (
                        optionItemsForOption.map((optionItem) => {
                          const isSelected = isItemSelected(option.id, optionItem.id);
                          const isDisabled = option.selection_type === 'multiple' &&
                            !isSelected && selectedItems.length >= option.max_selections;

                          return (
                            <Card
                              key={optionItem.id}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : isDisabled
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-muted/50'
                              }`}
                            >
                              <CardContent className="p-3">
                                <label className="flex items-center justify-between cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type={
                                        option.selection_type === 'multiple' ? 'checkbox' : 'radio'
                                      }
                                      name={`option-${option.id}`}
                                      checked={isSelected}
                                      disabled={isDisabled && !isSelected}
                                      onChange={(e) => handleOptionSelection(option, optionItem, e.target.checked)}
                                      className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span className="font-medium">{optionItem.name}</span>
                                  </div>

                                  {optionItem.additional_price > 0 && (
                                    <span className="text-primary font-medium">
                                      +{formatRupiah(optionItem.additional_price)}
                                    </span>
                                  )}
                                </label>
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground text-sm italic">No choices available for this option</p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Show message if no options */}
          {options.length === 0 && !loading && (
            <div className="text-center py-4 text-muted-foreground">
              <p>No options available for this menu item</p>
            </div>
          )}

          {/* Notes Textarea - Moved to bottom */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2">
              Catatan (opsional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Less sugar, extra ice"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Total:</span>
            <span className="text-xl font-bold text-primary">
              {formatRupiah(calculateTotalPrice())}
            </span>
          </div>

          <Button
            onClick={handleAddToCart}
            className="w-full"
            size="lg"
          >
            Add to Cart - {formatRupiah(calculateTotalPrice())}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}