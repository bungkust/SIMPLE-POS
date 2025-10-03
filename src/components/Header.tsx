import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { Coffee, Store, ShoppingBag, Utensils } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

const iconMap = {
  Coffee,
  Store,
  ShoppingBag,
  Utensils,
};

export function Header() {
  const navigate = useNavigate();
  const { config } = useConfig();

  const handleHistoryClick = () => {
    navigate('/orders');
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
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{config.storeName}</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleHistoryClick}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors touch-manipulation"
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            <span className="text-xs sm:text-sm font-medium text-slate-700 hidden sm:inline">Riwayat</span>
          </button>
        </div>
      </div>
    </header>
  );
}