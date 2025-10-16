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
  Clock,
  Star,
  Package,
  MapPin,
  Phone,
  Instagram,
  Twitter,
  Facebook
} from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '@/lib/form-utils';

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
              {config.storeIconType === 'uploaded' && config.storeIcon ? (
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
                  {config.storeDescription || 'Restaurant & Cafe'}
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

        {/* Tenant Information Bar - Single Column Layout */}
        <div className="border-t border-border bg-muted/30 py-3 sm:py-4">
          <div className="space-y-3">
            {/* Operating Hours & Status */}
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm font-medium">Jam Buka</div>
                <div className="text-sm text-muted-foreground">
                  {config.storeHours || '08:00-21:00'}
                </div>
              </div>
              <Badge className={`text-xs px-2 py-1 ${
                config.isOpen !== false 
                  ? 'bg-primary/10 text-primary border-primary/20' 
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}>
                {config.isOpen !== false ? 'Buka' : 'Tutup'}
              </Badge>
            </div>

            {/* Address */}
            {config.storeAddress && (
              <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{config.storeAddress}</span>
              </div>
            )}
            
            {/* Phone */}
            {config.storePhone && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>{config.storePhone}</span>
              </div>
            )}

            {/* Social Media */}
            {config.socialMedia && (
              <div className="flex items-center gap-3">
                {config.socialMedia.instagram && (
                  <a 
                    href={config.socialMedia.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Instagram</span>
                  </a>
                )}
                
                {config.socialMedia.tiktok && (
                  <a 
                    href={config.socialMedia.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <svg className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span className="hidden sm:inline">TikTok</span>
                  </a>
                )}
                
                {config.socialMedia.twitter && (
                  <a 
                    href={config.socialMedia.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Twitter className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Twitter</span>
                  </a>
                )}
                
                {config.socialMedia.facebook && (
                  <a 
                    href={config.socialMedia.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Facebook className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Facebook</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
