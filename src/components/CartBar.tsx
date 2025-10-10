import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatRupiah } from '../lib/utils';
import { getTenantInfo } from '../lib/tenantUtils';

export function CartBar() {
  const navigate = useNavigate();
  const { totalItems, totalAmount } = useCart();
  
  // Get tenant info - use currentTenant if available (authenticated), otherwise use URL
  const getTenantInfoLocal = () => {
    try {
      const { currentTenant } = useAuth();
      if (currentTenant) {
        return currentTenant;
      }
    } catch (error) {
      // AuthContext not available, use URL fallback
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
  };

  const tenantInfo = getTenantInfoLocal();

  const handleCheckoutClick = () => {
    const tenantSlug = tenantInfo.tenant_slug;
    navigate(`/${tenantSlug}/checkout`);
  };

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40 safe-area-pb">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <button
          onClick={handleCheckoutClick}
          className="w-full bg-green-500 text-white py-3 sm:py-4 rounded-lg flex items-center justify-between px-4 sm:px-6 hover:bg-green-600 active:bg-green-700 transition-colors touch-manipulation min-h-[48px]"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-semibold text-sm sm:text-base">{totalItems} Item{totalItems > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-bold text-sm sm:text-base">{formatRupiah(totalAmount)}</span>
            <span className="text-xs sm:text-sm font-medium">Checkout →</span>
          </div>
        </button>
      </div>
    </div>
  );
}