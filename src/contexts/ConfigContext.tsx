import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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
  const { currentTenant } = useAuth();
  const [config, setConfig] = useState<AppConfig>({
    storeName: 'Loading...',
    storeIcon: 'Coffee',
    storeIconType: 'predefined'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenant) {
      const tenantSlug = currentTenant.tenant_slug;
      const defaultConfig = getDefaultConfigForTenant(tenantSlug);

      // Create tenant-specific localStorage key
      const storageKey = `tenant-config-${tenantSlug}`;

      // Load config from localStorage for this tenant
      const savedConfig = localStorage.getItem(storageKey);
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig({ ...defaultConfig, ...parsedConfig });
        } catch (error) {
          console.error('Error loading tenant config:', error);
          setConfig(defaultConfig);
        }
      } else {
        setConfig(defaultConfig);
      }
      setLoading(false);
    }
  }, [currentTenant]);

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    if (!currentTenant) return;

    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    // Save to localStorage with tenant-specific key
    const storageKey = `tenant-config-${currentTenant.tenant_slug}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedConfig));
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
