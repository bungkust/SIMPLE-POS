import { useState, useEffect } from 'react';
import { 
  LogOut, 
  Shield, 
  Settings, 
  Menu,
  X,
  User,
  Building2,
  Home,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet as SheetComponent, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { TenantsTab } from '../components/superadmin/TenantsTabNew';
import { SettingsTab } from '../components/superadmin/SettingsTabNew';
import { logger } from '@/lib/logger';

interface SuperAdminDashboardProps {
  onBack: () => void;
}

type TabType = 'overview' | 'tenants' | 'settings';

const navigationItems = [
  { id: 'overview' as TabType, label: 'Overview', icon: Home, description: 'Platform overview and stats' },
  { id: 'tenants' as TabType, label: 'Tenants', icon: Building2, description: 'Manage all tenants' },
  { id: 'settings' as TabType, label: 'Settings', icon: Settings, description: 'Platform settings' },
];

export function SuperAdminDashboard({ onBack }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user, isSuperAdmin, loading } = useAuth();

  // Debug logging
  useEffect(() => {
    logger.log('SuperAdminDashboard: Component mounted/updated', {
      component: 'SuperAdminDashboard',
      loading,
      user: user?.email || 'no user',
      isSuperAdmin
    });
  }, [loading, user, isSuperAdmin]);

  // Show error if loading takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        logger.error('Super Admin Dashboard loading timeout - check console for errors', {
          component: 'SuperAdminDashboard',
          timeout: true
        });
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
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Memuat Super Admin Dashboard</h3>
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
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="shadow-xl border-0 max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-4">
              You don't have super admin privileges to access this page.
            </p>
            <Button
              onClick={onBack}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      onBack();
    } catch (error) {
      logger.error('Error signing out', { error: error.message, component: 'SuperAdminDashboard' });
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'tenants':
        return <TenantsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo & Platform Info */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 truncate">
              Super Admin Dashboard
            </h1>
            <p className="text-sm text-slate-600 truncate">
              Platform Management
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
              {user?.email || 'Super Admin'}
            </p>
            <Badge variant="secondary" className="text-xs">
              Super Admin
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
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Homepage</span>
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

// Overview Tab Component
function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platform Overview</h2>
          <p className="text-slate-600 mt-1">
            Monitor platform health and key metrics
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Total Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">-</div>
            <p className="text-xs text-slate-500">Active tenants</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <User className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">-</div>
            <p className="text-xs text-slate-500">Platform users</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Orders Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">-</div>
            <p className="text-xs text-slate-500">Across all tenants</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-slate-500">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
          <CardDescription>
            Latest platform activities and events
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No recent activity</h3>
            <p className="text-slate-600">
              Activity will appear here as users interact with the platform
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}