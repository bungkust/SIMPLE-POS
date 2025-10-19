import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Coffee, 
  Store, 
  ShoppingBag, 
  Utensils,
  User,
  Settings,
  LogOut,
  Home
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 py-4 space-y-2">
        {/* First Row: Logo and Store Name */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleLogoClick}
            className="flex items-center gap-3 px-0 hover:bg-transparent"
          >
            {config.storeLogoUrl ? (
              <img
                src={config.storeLogoUrl}
                alt="Store Logo"
                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  console.log('🔧 Store logo failed to load:', config.storeLogoUrl);
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 ${config.storeLogoUrl ? 'hidden' : ''}`}>
              {getStoreIcon()}
            </div>
            <div className="text-left min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold truncate">
                {config.storeName || ('tenant_name' in tenantInfo ? tenantInfo.tenant_name : tenantInfo.name)}
              </h1>
            </div>
          </Button>

          {/* Actions - Only show for authenticated users */}
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Admin
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
          )}
        </div>

        {/* Second Row: Store Description */}
        <div className="flex items-center">
          <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
            {config.storeDescription || 'Restaurant & Cafe'}
          </p>
        </div>

        {/* Third Row: Store Status and Hours */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                config.isOpen !== false ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm sm:text-base font-medium text-muted-foreground">
                {config.isOpen !== false ? 'Buka' : 'Tutup'}
              </span>
            </div>
            
            {config.storeHours && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                <span className="text-sm sm:text-base text-muted-foreground">
                  {config.storeHours}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fourth Row: Store Address */}
        {config.storeAddress && (
          <div className="flex items-center">
            <span className="text-sm sm:text-base text-muted-foreground">
              📍 {config.storeAddress}
            </span>
          </div>
        )}

        {/* Fifth Row: Store Phone */}
        {config.storePhone && (
          <div className="flex items-center">
            <a 
              href={`tel:${config.storePhone}`}
              className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors"
            >
              📞 {config.storePhone}
            </a>
          </div>
        )}

        {/* Sixth Row: Social Media Links */}
        {config.socialMedia && (config.socialMedia.instagram || config.socialMedia.tiktok || config.socialMedia.twitter || config.socialMedia.facebook) && (
          <div className="flex items-center gap-4 -mt-1">
              {config.socialMedia.instagram && (
                <a 
                  href={config.socialMedia.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-5 w-5 hover:scale-110 transition-transform text-muted-foreground hover:text-foreground"
                  title="Instagram"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
              )}
              
              {config.socialMedia.tiktok && (
                <a 
                  href={config.socialMedia.tiktok} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-5 w-5 hover:scale-110 transition-transform text-muted-foreground hover:text-foreground"
                  title="TikTok"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
              
              {config.socialMedia.twitter && (
                <a 
                  href={config.socialMedia.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-5 w-5 hover:scale-110 transition-transform text-muted-foreground hover:text-foreground"
                  title="X (Twitter)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              
              {config.socialMedia.facebook && (
                <a 
                  href={config.socialMedia.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-5 w-5 hover:scale-110 transition-transform text-muted-foreground hover:text-foreground"
                  title="Facebook"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
              )}
          </div>
        )}
      </div>
    </header>
  );
}
