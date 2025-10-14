import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Plus, 
  Minus, 
  Package,
  Check,
  Star,
  Clock,
  DollarSign
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '@/lib/form-utils';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  base_price?: number;
  photo_url?: string;
  category_id?: string;
  is_available: boolean;
  preparation_time?: number;
  tenant_id: string;
}

interface MenuDetailSheetProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuOptionItem {
  id: string;
  menu_option_id: string;
  name: string;
  additional_price: number;
  is_available: boolean;
  sort_order: number;
  tenant_id: string;
}

interface MenuOption {
  id: string;
  menu_item_id: string;
  label: string;
  selection_type: 'single_required' | 'single_optional' | 'multiple';
  max_selections: number;
  is_required: boolean;
  sort_order: number;
  tenant_id: string;
  items?: MenuOptionItem[];
}

export function MenuDetailSheet({ item, isOpen, onClose }: MenuDetailSheetProps) {
  const { addItem, getItemQuantity, removeItem } = useCart();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load menu options from database
  useEffect(() => {
    const loadMenuOptions = async () => {
      if (!item || !isOpen) return;
      
      setLoadingOptions(true);
      try {
        const { data: options, error } = await supabase
          .from('menu_options')
          .select(`
            *,
            items:menu_option_items(*)
          `)
          .eq('menu_item_id', item.id)
          .eq('tenant_id', item.tenant_id)
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Error loading menu options:', error);
          return;
        }

        setMenuOptions(options || []);
        
        // Initialize selected options with defaults
        const defaults: Record<string, string> = {};
        options?.forEach(option => {
          if (option.items && option.items.length > 0) {
            // Find the first available item as default
            const defaultItem = option.items.find(item => item.is_available);
            if (defaultItem) {
              defaults[option.id] = defaultItem.id;
            }
          }
        });
        setSelectedOptions(defaults);
        setQuantity(1);
      } catch (error) {
        console.error('Error loading menu options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadMenuOptions();
  }, [item, isOpen]);

  if (!item) return null;

  const handleOptionSelect = (groupId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupId]: optionId
    }));
  };

  const calculateTotalPrice = () => {
    let total = item.price;
    
    // Add customization prices from database options
    menuOptions.forEach(option => {
      const selectedOptionId = selectedOptions[option.id];
      if (selectedOptionId && option.items) {
        const selectedItem = option.items.find(item => item.id === selectedOptionId);
        if (selectedItem) {
          total += selectedItem.additional_price;
        }
      }
    });

    return total * quantity;
  };

  const handleAddToCart = () => {
    const totalPrice = calculateTotalPrice();
    
    // Create cart item with customizations
    const cartItem = {
      id: `${item.id}-${JSON.stringify(selectedOptions)}`, // Keep complex ID for cart management
      name: item.name,
      price: totalPrice / quantity, // Price per unit
      qty: quantity,
      photo_url: item.photo_url,
      notes: JSON.stringify(selectedOptions), // Store customizations in notes for database
      menu_id: item.id // Store original menu ID for database
    };

    addItem(cartItem);
    onClose();
  };

  const getItemQuantityInCart = () => {
    // Check if this exact combination is in cart
    const cartKey = `${item.id}-${JSON.stringify(selectedOptions)}`;
    return getItemQuantity(cartKey);
  };

  const isCompleted = (optionId: string) => {
    return selectedOptions[optionId] !== undefined;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg lg:max-w-2xl p-0 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold">Menu Details</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Single Grid Layout - Consistent for all screen sizes */}
            <div className="space-y-0">
              {/* Product Image */}
              <div className="relative h-64 sm:h-80 lg:h-96 bg-muted">
                {item.photo_url ? (
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                
                {/* Rating Badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-background/90 text-foreground border border-border">
                    <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                    4.8
                  </Badge>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                      {item.name}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {item.description || 'Delicious menu item'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl sm:text-3xl font-bold">
                      {formatCurrency(item.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">Base price</p>
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="flex items-center gap-4 text-sm sm:text-base text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{item.preparation_time || 15} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Free delivery</span>
                  </div>
                </div>

                {/* Customization Options */}
                <div className="space-y-6">
                  {loadingOptions ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading options...</p>
                    </div>
                  ) : (
                    menuOptions.map((option) => (
                      <div key={option.id}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-base sm:text-lg">
                            {option.label}
                          </h3>
                          {isCompleted(option.id) && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              <Check className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {option.items?.filter(item => item.is_available).map((optionItem) => (
                            <label
                              key={optionItem.id}
                              className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors bg-background"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={option.id}
                                  value={optionItem.id}
                                  checked={selectedOptions[option.id] === optionItem.id}
                                  onChange={() => handleOptionSelect(option.id, optionItem.id)}
                                  className="w-4 h-4 text-primary border-border focus:ring-primary"
                                />
                                <span className="font-medium text-sm sm:text-base">
                                  {optionItem.name}
                                </span>
                              </div>
                              {optionItem.additional_price > 0 && (
                                <span className="text-sm sm:text-base font-medium text-muted-foreground">
                                  +{formatCurrency(optionItem.additional_price)}
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Add to Cart */}
          <div className="p-4 lg:p-6 border-t border-border bg-background">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm sm:text-base">Quantity</span>
              <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 p-0 border-0 rounded-none hover:bg-muted/50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-12 h-10 flex items-center justify-center border-l border-r border-border bg-white">
                  <span className="font-medium text-sm sm:text-base">{quantity}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 p-0 border-0 rounded-none hover:bg-muted/50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full h-12 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm sm:text-base rounded-lg"
            >
              Add to Basket - {formatCurrency(calculateTotalPrice())} (Incl. tax)
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
