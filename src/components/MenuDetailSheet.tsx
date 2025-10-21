import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  X, 
  Plus, 
  Minus, 
  Package
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '@/lib/form-utils';
import { supabase } from '@/lib/supabase';
import { colors, typography, components, sizes, cn } from '@/lib/design-system';

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
  const { addItem } = useCart();
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
        options?.forEach((option: any) => {
          if (option.items && option.items.length > 0) {
            // Find the first available item as default
            const defaultItem = option.items.find((item: any) => item.is_available);
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

  // Debug logging
  console.log('MenuDetailSheet render:', { selectedOptions, menuOptions });

  const handleOptionSelect = (groupId: string, optionId: string) => {
    console.log('🔄 handleOptionSelect called:', { groupId, optionId });
    console.log('📊 Current selectedOptions before:', selectedOptions);
    
    setSelectedOptions(prev => {
      const newOptions = {
        ...prev,
        [groupId]: optionId
      };
      console.log('✅ New selected options after:', newOptions);
      console.log('🎯 Is this option selected?', newOptions[groupId] === optionId);
      return newOptions;
    });
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
    
    // Structure the options properly
    const structuredNotes = `OPTIONS:${JSON.stringify(selectedOptions)}`;
    
    // Create cart item with customizations
    const cartItem = {
      id: `${item.id}-${JSON.stringify(selectedOptions)}`, // Keep complex ID for cart management
      name: item.name,
      price: totalPrice / quantity, // Price per unit
      qty: quantity,
      photo_url: item.photo_url,
      notes: structuredNotes, // Store customizations in structured format
      menu_id: item.id // Store original menu ID for database
    };

    addItem(cartItem);
    onClose();
  };



  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg lg:max-w-2xl p-0 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <SheetTitle className={cn(typography.h3)}>Menu Details</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
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
                
              </div>

              {/* Product Info */}
              <div className={cn(sizes.card.lg)}>
                <div className="mb-4">
                  <h1 className={cn(typography.h1, "mb-2")}>
                    {item.name}
                  </h1>
                  <p className={cn(typography.body.medium, colors.text.secondary, "mb-3")}>
                    {item.description || 'Delicious menu item'}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className={cn(typography.price.large)}>
                      {formatCurrency(item.price)}
                    </p>
                    <p className={cn(typography.body.small, colors.text.muted)}>Base price</p>
                  </div>
                </div>


                {/* Customization Options */}
                <div className="space-y-6">
                  {loadingOptions ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className={cn(typography.body.small, colors.text.secondary, "mt-2")}>Loading options...</p>
                    </div>
                  ) : (
                    menuOptions.map((option) => (
                      <div key={option.id}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={cn(typography.h4)}>
                            {option.label}
                          </h3>
                        </div>
                        
                        <div className="space-y-2">
                          {option.items?.filter(item => item.is_available).map((optionItem) => {
                            const isSelected = selectedOptions[option.id] === optionItem.id;
                            console.log(`🔍 Option ${optionItem.name}:`, { 
                              optionId: option.id, 
                              optionItemId: optionItem.id, 
                              isSelected,
                              isSelectedType: typeof isSelected,
                              isSelectedStrict: isSelected === true,
                              selectedOptionsForGroup: selectedOptions[option.id],
                              shouldShowDot: isSelected ? 'YES' : 'NO'
                            });
                            return (
                            <div
                              key={optionItem.id}
                              className={cn(
                                components.card, 
                                "flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200",
                                isSelected 
                                  ? "border-2 border-blue-500 bg-blue-50 shadow-md" 
                                  : "border border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50"
                              )}
                              onClick={() => {
                                console.log('📦 Container clicked:', { optionId: option.id, optionItemId: optionItem.id, isSelected });
                                handleOptionSelect(option.id, optionItem.id);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {/* Custom Radio Button */}
                                <div 
                                  className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200",
                                    isSelected
                                      ? "border-blue-600 bg-blue-600"
                                      : "border-gray-300 bg-white hover:border-blue-400"
                                  )}
                                  onClick={(e) => {
                                    console.log('🎯 Radio button clicked:', { optionId: option.id, optionItemId: optionItem.id, isSelected });
                                    e.stopPropagation();
                                    handleOptionSelect(option.id, optionItem.id);
                                  }}
                                >
                                  {isSelected === true && (
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                  )}
                                </div>
                                
                                <span className={cn(
                                  typography.body.medium, 
                                  "font-medium cursor-pointer transition-colors",
                                  isSelected 
                                    ? "text-blue-700 font-semibold" 
                                    : "text-gray-900"
                                )}>
                                  {optionItem.name}
                                </span>
                              </div>
                              {optionItem.additional_price > 0 && (
                                <span className={cn(
                                  typography.body.medium, 
                                  "font-medium cursor-pointer transition-colors",
                                  isSelected 
                                    ? "text-blue-600 font-semibold" 
                                    : "text-gray-600"
                                )}>
                                  +{formatCurrency(optionItem.additional_price)}
                                </span>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Add to Cart */}
          <div className={cn("p-6 border-t border-gray-200 bg-white")}>
            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-4">
              <span className={cn(typography.label.large)}>Quantity</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 p-0 border-0 rounded-none hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-12 h-10 flex items-center justify-center border-l border-r border-gray-200 bg-white">
                  <span className={cn(typography.body.medium, "font-medium")}>{quantity}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 p-0 border-0 rounded-none hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className={cn(components.buttonPrimary, "w-full h-12 font-semibold text-base rounded-lg")}
            >
              Add to Basket - {formatCurrency(calculateTotalPrice())} (Incl. tax)
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
