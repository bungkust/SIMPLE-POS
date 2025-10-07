import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface AppConfig {
  storeName: string;
  storeIcon: string; // Can be either icon name or uploaded icon URL
  storeIconType: 'predefined' | 'uploaded'; // Track if it's predefined or uploaded
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
      storeIconType: 'predefined'
    },
    'matchae': {
      storeName: 'Matchae',
      storeIcon: 'Coffee',
      storeIconType: 'predefined'
    },
    'testcafe': {
      storeName: 'Test Cafe',
      storeIcon: 'Store',
      storeIconType: 'predefined'
    },
    'demostore': {
      storeName: 'Demo Store',
      storeIcon: 'ShoppingBag',
      storeIconType: 'predefined'
    }
  };

  return tenantDefaults[tenantSlug] || {
    storeName: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1).replace('-', ' '),
    storeIcon: 'Coffee',
    storeIconType: 'predefined'
  };
};

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { currentTenant, user } = useAuth();
  const [config, setConfig] = useState<AppConfig>({
    storeName: 'Loading...',
    storeIcon: 'Coffee',
    storeIconType: 'predefined'
  });
  const [loading, setLoading] = useState(true);

  // Load config from database first, then localStorage as fallback
  const loadConfig = async (tenantSlug: string) => {
    try {
      // Try to load from database if user is authenticated
      if (user && currentTenant) {
        const { data, error } = await supabase
          .from('tenant_settings')
          .select('*')
          .eq('tenant_id', currentTenant.tenant_id)
          .single();

        if (data && !error) {
          const dbConfig: AppConfig = {
            storeName: data.store_name || getDefaultConfigForTenant(tenantSlug).storeName,
            storeIcon: data.store_icon || getDefaultConfigForTenant(tenantSlug).storeIcon,
            storeIconType: data.store_icon_type || 'predefined'
          };
          setConfig(dbConfig);

          // Also save to localStorage for faster subsequent loads
          const storageKey = `tenant-config-${tenantSlug}`;
          localStorage.setItem(storageKey, JSON.stringify(dbConfig));

          return;
        }
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
      // Save to database if user is authenticated
      if (user && currentTenant) {
        const { error } = await supabase
          .from('tenant_settings')
          .upsert({
            tenant_id: currentTenant.tenant_id,
            store_name: newConfig.storeName,
            store_icon: newConfig.storeIcon,
            store_icon_type: newConfig.storeIconType,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error saving config to database:', error);
          // Continue with localStorage fallback
        }
      }

      // Always save to localStorage for immediate availability
      const storageKey = `tenant-config-${tenantSlug}`;
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  useEffect(() => {
    if (currentTenant) {
      loadConfig(currentTenant.tenant_slug);
      setLoading(false);
    }
  }, [currentTenant, user]);

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    if (!currentTenant) return;

    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    // Save to both database and localStorage
    await saveConfig(currentTenant.tenant_slug, updatedConfig);
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
