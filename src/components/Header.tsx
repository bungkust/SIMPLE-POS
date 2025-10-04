import { useNavigate } from 'react-router-dom';
import { Coffee, Store, ShoppingBag, Utensils } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';

const iconMap = {
  Coffee,
  Store,
  ShoppingBag,
  Utensils,
};

export function Header() {
  const navigate = useNavigate();
  const { config } = useConfig();
  const { tenant } = useAuth();

  const handleHistoryClick = () => {
    const tenantSlug = tenant?.slug || 'kopipendekar';
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
            {tenant ? `${tenant.name}` : config.storeName}
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