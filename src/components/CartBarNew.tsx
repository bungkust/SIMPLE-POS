import React, { useMemo, useState } from 'react';
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

export function CartBar() {
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
  const [showCartSheet, setShowCartSheet] = useState(false);
  
  // Get auth context safely
  let currentTenant = null;
  try {
    const { currentTenant: authTenant } = useAuth();
    currentTenant = authTenant;
  } catch (error) {
    // AuthContext not available, will use URL fallback
  }
  
  // Get tenant info - use currentTenant if available (authenticated), otherwise use URL
  const tenantInfo = useMemo(() => {
    if (currentTenant) {
      return currentTenant;
    }
    
    // Fallback: get tenant slug from URL
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(Boolean);
    
    if (pathParts.length >= 1 && !pathParts[0].includes('admin') && !pathParts[0].includes('login') && pathParts[0] !== 'checkout' && pathParts[0] !== 'orders' && pathParts[0] !== 'invoice' && pathParts[0] !== 'success' && pathParts[0] !== 'auth') {
      return {
        tenant_slug: pathParts[0],
        tenant_id: null,
        tenant_name: pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1).replace('-', ' '),
        role: 'public' as const
      };
    }
    
    return {
      tenant_slug: 'kopipendekar',
      tenant_id: null,
      tenant_name: 'Kopi Pendekar',
      role: 'public' as const
    };
  }, [currentTenant]);

  const handleCheckoutClick = () => {
    const tenantSlug = tenantInfo.tenant_slug;
    navigate(`/${tenantSlug}/checkout`);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  if (totalItems === 0) return null;

  return (
    <>
      {/* Floating Cart Button - Limited Width */}
      <div className="fixed bottom-4 left-4 right-4 z-50">
        <div className="max-w-5xl mx-auto">
          <Button
            onClick={() => setShowCartSheet(true)}
            className="group relative h-16 w-full px-6 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground overflow-hidden"
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
                <div className="text-sm font-medium opacity-90">
                  {totalItems === 0 ? 'Cart Empty' : `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
                </div>
                <div className="text-lg font-bold">
                  {totalItems === 0 ? 'Start Shopping' : formatCurrency(totalAmount)}
                </div>
              </div>
            </div>
            
            {/* Right Side - Checkout Arrow */}
            {totalItems > 0 && (
              <div className="flex items-center">
                <div className="text-sm font-medium opacity-90 mr-2">Checkout</div>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </Button>
        </div>
      </div>

      {/* Cart Sheet */}
      <Sheet open={showCartSheet} onOpenChange={setShowCartSheet}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-sm sm:text-base">
              <ShoppingCart className="h-3 w-3 sm:h-5 sm:w-5" />
              Your Cart
            </SheetTitle>
            <SheetDescription className="text-xs sm:text-sm">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Cart Items */}
            {items.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Package className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-sm sm:text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground text-xs sm:text-base">
                  Add some delicious items to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        {item.photo_url && (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {formatCurrency(item.price)}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="h-7 w-7 sm:h-6 sm:w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-6 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="h-7 w-7 sm:h-6 sm:w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(item.id)}
                              className="h-7 w-7 sm:h-6 sm:w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Cart Summary */}
            {items.length > 0 && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{formatCurrency(0)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Free delivery on orders over {formatCurrency(50000)}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Button 
                    onClick={handleCheckoutClick}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearCart}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
