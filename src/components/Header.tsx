import { useNavigate, useLocation } from 'react-router-dom';
import { History, LogIn } from 'lucide-react';
import { Coffee, Store, ShoppingBag, Utensils } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';

const iconMap = {
  Coffee,
  Store,
  ShoppingBag,
  Utensils,
};

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { config } = useConfig();

  const handleHistoryClick = () => {
    navigate('/orders');
  };

  const handleAdminClick = () => {
    if (!user) {
      navigate('/admin/login');
    } else if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      alert('You do not have admin access. Please contact your administrator.');
    }
  };

  // Hide admin button for regular users (not on admin pages)
  const isAdminPage = location.pathname.startsWith('/admin');
  const showAdminButton = isAdmin || isAdminPage;

  // Render icon based on type and source
  const renderIcon = () => {
    if (config.storeIconType === 'uploaded' && config.storeIcon) {
      // Render uploaded image
      return (
        <img
          src={config.storeIcon}
          alt="Store icon"
          className="w-6 h-6 object-cover"
        />
      );
    } else {
      // Render predefined icon
      const IconComponent = iconMap[config.storeIcon as keyof typeof iconMap] || Coffee;
      return <IconComponent className="w-6 h-6 text-green-500" />;
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {renderIcon()}
          <h1 className="text-xl font-bold text-slate-900">{config.storeName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleHistoryClick}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <History className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">Riwayat</span>
          </button>
          {showAdminButton && (
            <button
              onClick={handleAdminClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogIn className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {user ? (isAdmin ? 'Admin' : 'Login') : 'Login'}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}