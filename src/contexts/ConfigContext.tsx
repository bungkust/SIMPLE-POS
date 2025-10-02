import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

const DEFAULT_CONFIG: AppConfig = {
  storeName: 'Kopi Pendekar',
  storeIcon: 'Coffee',
  storeIconType: 'predefined'
};

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('kopi-pendekar-config');
    if (savedConfig) {
      try {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
    setLoading(false);
  }, []);

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    // Save to localStorage
    localStorage.setItem('kopi-pendekar-config', JSON.stringify(updatedConfig));
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
