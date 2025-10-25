import React, { useMemo, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '@/lib/form-utils';
import { getTenantInfo } from '../lib/tenantUtils';
import { colors, typography, components, sizes, shadows, cn } from '@/lib/design-system';

function CartBarComponent() {
  const navigate = useNavigate();
  const { 
    items, 
    totalItems, 
    totalAmount, 
    addItem, 
    removeItem, 
    updateQuantity, 
    clearCart 
  } = useCart();
  
  // Debug cart state (remove in production)
  // console.log('🔍 CartBar: items:', items);
  // console.log('🔍 CartBar: totalItems:', totalItems);
  // console.log('🔍 CartBar: totalAmount:', totalAmount);
  const [showCartSheet, setShowCartSheet] = useState(false);
  
  // Get auth context safely
  let currentTenant = null;
  try {
    const authContext = useAuth();
    currentTenant = authContext?.currentTenant || null;
  } catch (error) {
    // AuthContext not available, will use URL fallback
    console.log('AuthContext not available, using URL fallback');
  }
  
  // Get tenant info - only use currentTenant from AuthContext (secure)
  const tenantInfo = useMemo(() => {
    if (currentTenant) {
      return currentTenant;
    }
    
    // No insecure fallback - return null if no authenticated tenant
    return null;
  }, [currentTenant]);

  const handleCheckoutClick = useCallback(() => {
    if (totalItems === 0) {
      // If cart is empty, just open the cart sheet
      setShowCartSheet(true);
      return;
    }
    
    // Check if tenant info is available
    if (!tenantInfo) {
      console.error('No tenant information available for checkout');
      return;
    }
    
    // Handle both currentTenant structure (slug) and fallback structure (tenant_slug)
    const tenantSlug = tenantInfo.slug || tenantInfo.tenant_slug;
    console.log('🔍 CartBar: handleCheckoutClick called');
    console.log('🔍 CartBar: tenantInfo:', tenantInfo);
    console.log('🔍 CartBar: tenantSlug:', tenantSlug);
    console.log('🔍 CartBar: navigating to:', `/${tenantSlug}/checkout`);
    navigate(`/${tenantSlug}/checkout`);
  }, [tenantInfo, navigate, totalItems]);

  const handleQuantityChange = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  }, [removeItem, updateQuantity]);

  const handleAddItem = useCallback((item: any) => {
    addItem(item);
  }, [addItem]);

  const handleRemoveItem = useCallback((itemId: string) => {
    removeItem(itemId);
  }, [removeItem]);

  const handleClearCart = useCallback(() => {
    clearCart();
  }, [clearCart]);

  const handleToggleCartSheet = useCallback(() => {
    setShowCartSheet(prev => !prev);
  }, []);

  // Hide cart button when cart is empty
  if (totalItems === 0) return null;

  return (
    <>
      {/* Floating Cart Button - Limited Width */}
      <div className="fixed bottom-4 left-4 right-4 z-50">
        <div className="max-w-5xl mx-auto">
          <Button
            onClick={handleToggleCartSheet}
            className={cn(
              "group relative h-16 w-full px-6 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300",
              "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white overflow-hidden"
            )}
          >
          {/* Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 flex items-center justify-between w-full">
            {/* Left Side - Cart Icon & Item Count */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingCart className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
                {totalItems > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg">
                    {totalItems > 99 ? '99+' : totalItems}
                  </div>
                )}
              </div>
              
              {/* Cart Details */}
              <div className="text-left">
                <div className="text-sm font-semibold text-white opacity-90">
                  {totalItems === 0 ? 'Cart Empty' : `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
                </div>
                <div className="text-lg font-bold text-white">
                  {totalItems === 0 ? 'Start Shopping' : formatCurrency(totalAmount)}
                </div>
              </div>
            </div>
            
            {/* Right Side - Checkout Arrow */}
            <div className="flex items-center">
              <div className="text-sm font-medium opacity-90 mr-2">
                {totalItems > 0 ? 'Checkout' : 'View Cart'}
              </div>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </Button>
        </div>
      </div>

      {/* Cart Sheet */}
      <Sheet open={showCartSheet} onOpenChange={handleToggleCartSheet}>
        <SheetContent className="w-full sm:max-w-md p-0 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex flex-col h-full">
            {/* Header - Fixed */}
            <SheetHeader className="p-4 pb-0 flex-shrink-0">
              <SheetTitle className={cn(typography.h3)}>Your Cart</SheetTitle>
              <SheetDescription className={cn(typography.body.medium, colors.text.secondary, "mt-2")}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
              </SheetDescription>
            </SheetHeader>

            {/* Cart Items - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4">
            {/* Cart Items */}
            {items.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className={cn("w-20 h-20 mx-auto mb-4 rounded-full", colors.background.muted, "flex items-center justify-center")}>
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className={cn(typography.h3, "mb-2")}>Your cart is empty</h3>
                <p className={cn(typography.body.medium, colors.text.muted, "max-w-sm mx-auto")}>
                  Add some delicious items to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto">
                {items.map((item) => (
                  <Card key={item.id} className={cn(components.card, components.cardHover)}>
                    <CardContent className={sizes.card.md}>
                      <div className="flex items-start gap-4">
                        {item.photo_url && (
                          <div className={cn("w-16 h-16 rounded-xl overflow-hidden flex-shrink-0", shadows.sm)}>
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(typography.h4, "truncate mb-1")}>{item.name}</h4>
                          <p className={cn(typography.price.small, colors.text.secondary)}>
                            {formatCurrency(item.price)}
                          </p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.qty - 1)}
                                className="h-8 w-8 p-0 border-0 rounded-none hover:bg-gray-50"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <div className="w-8 h-8 flex items-center justify-center border-l border-r border-gray-200 bg-white">
                                <span className={cn(typography.body.medium, "font-medium")}>{item.qty}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.qty + 1)}
                                className="h-8 w-8 p-0 border-0 rounded-none hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </div>

            {/* Cart Summary - Fixed at Bottom */}
            {items.length > 0 && (
              <div className="border-t bg-white p-4 space-y-4 flex-shrink-0">
                <div className={cn("flex justify-between", typography.body.medium, colors.text.secondary)}>
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-medium">{formatCurrency(totalAmount)}</span>
                </div>
                
                <div className={cn("flex justify-between", typography.body.medium, colors.text.secondary)}>
                  <span>Tax</span>
                  <span className="font-medium">{formatCurrency(0)}</span>
                </div>
                
                <Separator />
                
                <div className={cn("flex justify-between", typography.price.large)}>
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>

                <Alert className={cn(components.alert, colors.status.success.bg, colors.status.success.border)}>
                  <CheckCircle className={cn("h-4 w-4", colors.status.success.icon)} />
                  <AlertDescription className={cn(typography.body.medium, colors.status.success.text)}>
                    Free delivery on orders over {formatCurrency(50000)}
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button 
                    onClick={handleCheckoutClick}
                    className={cn(components.buttonPrimary, "w-full h-12 text-base font-semibold")}
                    size="lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleClearCart}
                    className={cn(components.buttonOutline, "w-full h-10", colors.button.destructiveOutline)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export const CartBar = memo(CartBarComponent);
