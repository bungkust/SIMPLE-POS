import { useState, useEffect } from 'react';
import { 
  LogOut, 
  ShoppingBag, 
  Coffee, 
  CreditCard, 
  Settings, 
  FolderOpen, 
  Sheet, 
  Shield, 
  Home, 
  AlertCircle, 
  Calculator,
  Menu,
  X,
  User,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet as SheetComponent, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { OrdersTab } from '../components/admin/OrdersTabNew';
import { MenuTab } from '../components/admin/MenuTabNew';
import { PaymentTab } from '../components/admin/PaymentTabNew';
import { SettingsTab } from '../components/admin/SettingsTabNew';
import { CategoriesTab } from '../components/admin/CategoriesTabNew';
import { GoogleSheetsTab } from '../components/admin/GoogleSheetsTabNew';
import { CashierTab } from '../components/admin/CashierTabNew';

interface AdminDashboardProps {
  // Removed onBack prop since we handle logout redirection internally
}

type TabType = 'orders' | 'menu' | 'categories' | 'payment' | 'kasir' | 'settings' | 'sheets';

const navigationItems = [
  { id: 'orders' as TabType, label: 'Pesanan', icon: ShoppingBag, description: 'Kelola pesanan pelanggan' },
  { id: 'menu' as TabType, label: 'Menu', icon: Coffee, description: 'Kelola menu dan opsi' },
  { id: 'categories' as TabType, label: 'Kategori', icon: FolderOpen, description: 'Kelola kategori menu' },
  { id: 'payment' as TabType, label: 'Pembayaran', icon: CreditCard, description: 'Kelola metode pembayaran' },
  { id: 'kasir' as TabType, label: 'Kasir', icon: Calculator, description: 'Kelola kasir dan transaksi' },
  { id: 'sheets' as TabType, label: 'Google Sheets', icon: Sheet, description: 'Integrasi Google Sheets' },
  { id: 'settings' as TabType, label: 'Pengaturan', icon: Settings, description: 'Pengaturan tenant' },
];

export function AdminDashboard({}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user, currentTenant, isTenantOwner, loading } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('🔄 AdminDashboard: Component mounted/updated');
    console.log('🔄 AdminDashboard: Auth state:', {
      loading,
      user: user?.email || 'no user',
      currentTenant: currentTenant?.name || 'no tenant',
      isTenantOwner
    });
  }, [loading, user, currentTenant, isTenantOwner]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="shadow-xl border-0 max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Memuat Dashboard</h3>
            <p className="text-slate-600">Mohon tunggu sebentar...</p>
            {loadingTimeout && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Loading timeout. Check browser console (F12) for error messages
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if no access
  if (user && !isTenantOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="shadow-xl border-0 max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Error</h2>
            <p className="text-slate-600 mb-4">
              You don't have permission to access this tenant dashboard.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();

      // Redirect to specific tenant login page instead of calling onBack()
      if (currentTenant?.slug) {
        window.location.href = `/login`;
      } else {
        // Fallback to generic login if no tenant info
        window.location.href = '/kopipendekar/admin/login';
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign out error:', error);
      }
      // Even if sign out fails, redirect to login page
      if (currentTenant?.slug) {
        window.location.href = `/login`;
      } else {
        window.location.href = '/kopipendekar/admin/login';
      }
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersTab />;
      case 'menu':
        return <MenuTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'payment':
        return <PaymentTab />;
      case 'kasir':
        return <CashierTab />;
      case 'sheets':
        return <GoogleSheetsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OrdersTab />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo & Tenant Info */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 truncate">
              {currentTenant?.name || 'Admin Dashboard'}
            </h1>
            <p className="text-sm text-slate-600 truncate">
              {currentTenant?.description || 'Tenant Management'}
            </p>
          </div>
        </div>
        
        {/* User Info */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.email || 'Admin User'}
            </p>
            <Badge variant="secondary" className="text-xs">
              Owner
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-auto p-3 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${
                    isActive ? 'text-primary-foreground/80' : 'text-slate-500'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Quick Links & Logout */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Quick Links */}
        <div className="space-y-2">
          <a
            href="/kopipendekar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Homepage</span>
          </a>
          
          <a
            href="/kopipendekar/admin/login"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Login</span>
          </a>
        </div>

        <Separator />

        {/* Logout Button */}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span>Keluar</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-background border-r border-border overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <SheetComponent open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </SheetComponent>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Header */}
        <header className="bg-background border-b border-border sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile Menu Button */}
              <div className="flex items-center gap-4">
                <SheetComponent>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                </SheetComponent>
                
                {/* Breadcrumb */}
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {navigationItems.find(item => item.id === activeTab)?.description || ''}
                  </Badge>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4" />
                  <span className="truncate max-w-[120px]">{user?.email}</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {renderActiveTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
