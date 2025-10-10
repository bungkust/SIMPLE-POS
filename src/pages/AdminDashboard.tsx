import { useState, useEffect } from 'react';
import { LogOut, ShoppingBag, Coffee, CreditCard, Settings, FolderOpen, Sheet, Shield, Home, AlertCircle, Calculator } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OrdersTab } from '../components/admin/OrdersTab';
import { MenuTab } from '../components/admin/MenuTab';
import { PaymentTab } from '../components/admin/PaymentTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { GoogleSheetsTab } from '../components/admin/GoogleSheetsTab';
import { CashierTab } from '../components/admin/CashierTab';

interface AdminDashboardProps {
  // Removed onBack prop since we handle logout redirection internally
}

export function AdminDashboard({}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'categories' | 'payment' | 'kasir' | 'settings' | 'sheets'>('orders');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const { signOut, user, currentTenant, isTenantAdmin, loading, accessStatus } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('🔄 AdminDashboard: Component mounted/updated');
    console.log('🔄 AdminDashboard: Auth state:', {
      loading,
      user: user?.email || 'no user',
      currentTenant: currentTenant?.tenant_name || 'no tenant',
      isTenantAdmin,
      accessStatus: accessStatus ? 'has status' : 'no status'
    });
  }, [loading, user, currentTenant, isTenantAdmin, accessStatus]);

  // Show error if loading takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Dashboard loading timeout - check console for errors');
        }
        setLoadingTimeout(true);
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [loading]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat dashboard...</p>
          {loadingTimeout && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Loading Timeout</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                Check browser console (F12) for error messages
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error if no access
  if (!accessStatus && user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Error</h2>
          <p className="text-slate-600 mb-4">
            Unable to load user permissions. Check console for details.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();

      // Redirect to specific tenant login page instead of calling onBack()
      if (currentTenant?.tenant_slug) {
        window.location.href = `/${currentTenant.tenant_slug}/admin/login`;
      } else {
        // Fallback to generic login if no tenant info
        window.location.href = '/kopipendekar/admin/login';
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign out error:', error);
      }
      // Even if sign out fails, redirect to login page
      if (currentTenant?.tenant_slug) {
        window.location.href = `/${currentTenant.tenant_slug}/admin/login`;
      } else {
        window.location.href = '/kopipendekar/admin/login';
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-slate-600 truncate max-w-[120px] sm:max-w-none">{user?.email}</span>

              {/* Quick Access Links */}
              <div className="flex items-center gap-1 sm:gap-2">
                <a
                  href="/kopipendekar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors text-xs sm:text-sm"
                  title="Kopi Pendekar Homepage"
                >
                  <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Homepage</span>
                </a>

                <a
                  href="/kopipendekar/admin/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors text-xs sm:text-sm"
                  title="Admin Login"
                >
                  <Coffee className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </a>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Keluar</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>

          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors touch-manipulation min-w-fit whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm">Pesanan</span>
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors touch-manipulation min-w-fit whitespace-nowrap ${
                activeTab === 'menu'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span className="text-sm">Menu</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors touch-manipulation min-w-fit whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm">Kategori</span>
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors touch-manipulation min-w-fit whitespace-nowrap ${
                activeTab === 'payment'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">Pembayaran</span>
            </button>
            <button
              onClick={() => setActiveTab('kasir')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors touch-manipulation min-w-fit whitespace-nowrap ${
                activeTab === 'kasir'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span className="text-sm">Kasir</span>
            </button>
            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors touch-manipulation min-w-fit whitespace-nowrap ${
                activeTab === 'sheets'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sheet className="w-4 h-4" />
              <span className="text-sm">Google Sheets</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors touch-manipulation min-w-fit whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Pengaturan</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'menu' && <MenuTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'payment' && <PaymentTab />}
        {activeTab === 'kasir' && <CashierTab />}
        {activeTab === 'sheets' && <GoogleSheetsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}