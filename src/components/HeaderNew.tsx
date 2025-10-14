import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Coffee, 
  Store, 
  ShoppingBag, 
  Utensils,
  User,
  Settings,
  LogOut,
  Home,
  MapPin,
  Clock,
  Star,
  Info
} from 'lucide-react';
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

  const handleLogoClick = () => {
    const tenantSlug = 'tenant_slug' in tenantInfo ? tenantInfo.tenant_slug : tenantInfo.slug;
    navigate(`/${tenantSlug}`);
  };


  const handleSignOut = async () => {
    try {
      const { signOut } = useAuth();
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getStoreIcon = () => {
    const iconType = config.storeIconType || 'Coffee';
    const IconComponent = iconMap[iconType as keyof typeof iconMap] || Coffee;
    return <IconComponent className="h-6 w-6" />;
  };

  const isAuthenticated = 'role' in tenantInfo ? tenantInfo.role !== 'public' : false;

  return (
    <div className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Main Header */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo and Store Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              onClick={handleLogoClick}
              className="flex items-center gap-2 sm:gap-3 p-0 h-auto hover:bg-transparent min-w-0 flex-1"
            >
              {config.storeIcon ? (
                <img
                  src={config.storeIcon}
                  alt="Store Logo"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {getStoreIcon()}
                </div>
              )}
              <div className="text-left min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold truncate">
                  {config.storeName || ('tenant_name' in tenantInfo ? tenantInfo.tenant_name : tenantInfo.name)}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground truncate">
                  Cemilan, Kopi
                </p>
              </div>
            </Button>
          </div>

          {/* Actions - Only show for authenticated users */}
          {isAuthenticated && (
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                    <User className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/${'tenant_slug' in tenantInfo ? tenantInfo.tenant_slug : tenantInfo.slug}/admin`)}>
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/${'tenant_slug' in tenantInfo ? tenantInfo.tenant_slug : tenantInfo.slug}/admin/settings`)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Tenant Information Bar */}
        <div className="border-t border-border bg-muted/30 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Left Side - Rating and Info */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                <span className="text-sm sm:text-base font-semibold">4.8</span>
                <span className="text-sm text-muted-foreground hidden sm:inline">(127 reviews)</span>
              </div>

              {/* Estimated Time */}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <span className="text-sm sm:text-base text-muted-foreground">15-20 menit</span>
              </div>

              {/* Distance (if available) */}
              <div className="hidden sm:flex items-center gap-1">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <span className="text-sm sm:text-base text-muted-foreground">1.2 km</span>
              </div>
            </div>

            {/* Right Side - Status and Hours */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Operating Hours */}
              <div className="text-right">
                <div className="text-sm sm:text-base font-medium">Jam Buka</div>
                <div className="text-sm text-muted-foreground">Hari ini 08:00-21:00</div>
              </div>

              {/* Status Badge */}
              <Badge className="bg-green-100 text-green-800 border-green-200 text-sm sm:text-base px-3 py-1">
                Buka
              </Badge>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Biaya pemesanan senilai Rp3.000 berlaku di restoran ini.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
