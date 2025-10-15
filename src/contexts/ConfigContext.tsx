import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface AppConfig {
  storeName: string;
  storeIcon: string; // Can be either icon name or uploaded icon URL
  storeIconType: 'predefined' | 'uploaded'; // Track if it's predefined or uploaded
  storeDescription?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeHours?: string;
  autoAcceptOrders?: boolean;
  requirePhoneVerification?: boolean;
  allowGuestCheckout?: boolean;
  minimumOrderAmount?: number;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
}

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  loading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const getDefaultConfigForTenant = (tenantSlug: string): AppConfig => {
  // Default configurations for different tenants
  const tenantDefaults: Record<string, AppConfig> = {
    'kopipendekar': {
      storeName: 'Kopi Pendekar',
      storeIcon: 'Coffee',
      storeIconType: 'predefined',
      storeDescription: 'Kopi berkualitas tinggi dengan cita rasa yang unik',
      storeAddress: 'Jl. Contoh No. 123, Jakarta',
      storePhone: '+62 812-3456-7890',
      storeEmail: 'info@kopipendekar.com',
      storeHours: '08:00 - 22:00',
      autoAcceptOrders: false,
      requirePhoneVerification: false,
      allowGuestCheckout: true,
      minimumOrderAmount: 0,
      deliveryFee: 0,
      freeDeliveryThreshold: 0
    },
    'matchae': {
      storeName: 'Matchae',
      storeIcon: 'Coffee',
      storeIconType: 'predefined',
      autoAcceptOrders: false,
      requirePhoneVerification: false,
      allowGuestCheckout: true,
      minimumOrderAmount: 0,
      deliveryFee: 0,
      freeDeliveryThreshold: 0
    },
    'testcafe': {
      storeName: 'Test Cafe',
      storeIcon: 'Store',
      storeIconType: 'predefined',
      autoAcceptOrders: false,
      requirePhoneVerification: false,
      allowGuestCheckout: true,
      minimumOrderAmount: 0,
      deliveryFee: 0,
      freeDeliveryThreshold: 0
    },
    'demostore': {
      storeName: 'Demo Store',
      storeIcon: 'ShoppingBag',
      storeIconType: 'predefined',
      autoAcceptOrders: false,
      requirePhoneVerification: false,
      allowGuestCheckout: true,
      minimumOrderAmount: 0,
      deliveryFee: 0,
      freeDeliveryThreshold: 0
    }
  };

  return tenantDefaults[tenantSlug] || {
    storeName: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1).replace('-', ' '),
    storeIcon: 'Coffee',
    storeIconType: 'predefined',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    language: 'id',
    theme: 'light',
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    autoAcceptOrders: false,
    requirePhoneVerification: false,
    allowGuestCheckout: true,
    minimumOrderAmount: 0,
    deliveryFee: 0,
    freeDeliveryThreshold: 0
  };
};

export function ConfigProvider({ children }: { children: ReactNode }) {
  // Add error boundary for useAuth
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.warn('ConfigProvider: AuthContext not available yet, using fallback');
    authContext = {
      currentTenant: null,
      user: null
    };
  }

  // Memoize auth context to prevent unnecessary re-renders
  const memoizedAuthContext = useMemo(() => authContext, [authContext.currentTenant?.id, authContext.user?.id]);
  const { currentTenant, user } = memoizedAuthContext;
  const [config, setConfig] = useState<AppConfig>({
    storeName: 'Loading...',
    storeIcon: 'Coffee',
    storeIconType: 'predefined'
  });
  const [loading, setLoading] = useState(true);

  // Get tenant slug from URL for public pages
  const getTenantSlugFromUrl = (): string => {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(Boolean);
    
    // Check if path starts with tenant slug pattern
    if (pathParts.length >= 1 && !pathParts[0].includes('admin') && !pathParts[0].includes('login') && pathParts[0] !== 'checkout' && pathParts[0] !== 'orders' && pathParts[0] !== 'invoice' && pathParts[0] !== 'success' && pathParts[0] !== 'auth') {
      return pathParts[0];
    }
    
    return 'kopipendekar'; // Default tenant
  };

  // Load config from database first, then localStorage as fallback
  const loadConfig = async (tenantSlug: string) => {
    try {
      // Try to load from database if user is authenticated
      if (user && currentTenant) {
        // TODO: Fix tenant_settings table access - table doesn't exist
        // const { data, error } = await supabase
        //   .from('tenant_settings')
        //   .select('*')
        //   .eq('tenant_id', currentTenant.id)
        //   .single();

        // TODO: Use tenant.settings instead of tenant_settings table
        // if (data && !error) {
        //   const dbConfig: AppConfig = {
        //     storeName: data.store_name || getDefaultConfigForTenant(tenantSlug).storeName,
        //     storeIcon: data.store_icon || getDefaultConfigForTenant(tenantSlug).storeIcon,
        //     storeIconType: data.store_icon_type || 'predefined'
        //   };
        //   setConfig(dbConfig);

        //   // Also save to localStorage for faster subsequent loads
        //   const storageKey = `tenant-config-${tenantSlug}`;
        //   localStorage.setItem(storageKey, JSON.stringify(dbConfig));

        //   return;
        // }
      }

      // Fallback to localStorage
      const storageKey = `tenant-config-${tenantSlug}`;
      const savedConfig = localStorage.getItem(storageKey);
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig({ ...getDefaultConfigForTenant(tenantSlug), ...parsedConfig });
        } catch (error) {
          console.error('Error loading tenant config from localStorage:', error);
          setConfig(getDefaultConfigForTenant(tenantSlug));
        }
      } else {
        setConfig(getDefaultConfigForTenant(tenantSlug));
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setConfig(getDefaultConfigForTenant(tenantSlug));
    }
  };

  // Save config to database and localStorage
  const saveConfig = async (tenantSlug: string, newConfig: AppConfig) => {
    try {
      // TODO: Fix tenant_settings table access - table doesn't exist
      // Save to database if user is authenticated
      // if (user && currentTenant) {
      //   const { error } = await supabase
      //     .from('tenant_settings')
      //     .upsert({
      //       tenant_id: currentTenant.id,
      //       store_name: newConfig.storeName,
      //       store_icon: newConfig.storeIcon,
      //       store_icon_type: newConfig.storeIconType,
      //       updated_at: new Date().toISOString()
      //     });

      //   if (error) {
      //     console.error('Error saving config to database:', error);
      //     // Continue with localStorage fallback
      //   }
      // }

      // Always save to localStorage for immediate availability
      const storageKey = `tenant-config-${tenantSlug}`;
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  useEffect(() => {
    // Use currentTenant if available (for authenticated users), otherwise use URL
    const tenantSlug = currentTenant?.slug || getTenantSlugFromUrl();
    loadConfig(tenantSlug);
    setLoading(false);
  }, [currentTenant, user]);

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    // Use currentTenant if available (for authenticated users), otherwise use URL
    const tenantSlug = currentTenant?.slug || getTenantSlugFromUrl();
    
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    // Save to both database and localStorage
    await saveConfig(tenantSlug, updatedConfig);
  };

  return (
    <ConfigContext.Provider value={{
      config,
      updateConfig,
      loading
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
