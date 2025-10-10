import { useNavigate } from 'react-router-dom';
import { Coffee, Store, ShoppingBag, Utensils } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { getTenantInfo } from '../lib/tenantUtils';

const iconMap = {
  Coffee,
  Store,
  ShoppingBag,
  Utensils,
};

export function Header() {
  const navigate = useNavigate();
  const { config } = useConfig();
  
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

  const handleHistoryClick = () => {
    const tenantSlug = tenantInfo.tenant_slug;
    navigate(`/${tenantSlug}/orders`);
  };

  // Render icon based on type and source
  const renderIcon = () => {
    if (config.storeIconType === 'uploaded' && config.storeIcon) {
      // Render uploaded image
      return (
        <img
          src={config.storeIcon}
          alt="Store icon"
          className="w-6 h-6 sm:w-7 sm:h-7 object-cover"
        />
      );
    } else {
      // Render predefined icon
      const IconComponent = iconMap[config.storeIcon as keyof typeof iconMap] || Coffee;
      return <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />;
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {renderIcon()}
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
            {tenantInfo.tenant_name || config.storeName}
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleHistoryClick}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors touch-manipulation"
          >
            <span className="text-sm font-medium hidden sm:inline">Riwayat</span>
          </button>
        </div>
      </div>
    </header>
  );
}