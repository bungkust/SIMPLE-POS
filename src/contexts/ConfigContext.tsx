import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

import { logger } from '@/lib/logger';
interface AppConfig {
  storeName: string;
  storeIcon: string; // Can be either icon name or uploaded icon URL
  storeLogoUrl?: string; // Add missing field for logo_url
  storeBannerUrl?: string; // Add banner image field
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
  // Additional restaurant info fields
  rating?: string;
  reviewCount?: string;
  estimatedTime?: string;
  distance?: string;
  isOpen?: boolean;
  // Social media links
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
  };
  // Header display settings
  headerDisplaySettings?: {
    showDescription?: boolean;
    showOperatingHours?: boolean;
    showAddress?: boolean;
    showPhone?: boolean;
    showSocialMedia?: boolean;
  };
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
    logger.warn('ConfigProvider: AuthContext not available yet, using fallback');
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
    if (pathParts.length >= 1 && !pathParts[0].includes('admin') && !pathParts[0].includes('login') && pathParts[0] !== 'checkout' && pathParts[0] !== 'orders' && pathParts[0] !== 'invoice' && pathParts[0] !== 'success' && pathParts[0] !== 'auth' && pathParts[0] !== 'undefined' && pathParts[0] !== 'null') {
      return pathParts[0];
    }
    
    return 'kopipendekar'; // Default tenant
  };

  // Load config from database first, then localStorage as fallback
  const loadConfig = async (tenantSlug: string) => {
    try {
      // Try to load from database if user is authenticated
      if (user && currentTenant) {
        // Load tenant info from tenant_info table
        const { data: tenantInfoData, error: tenantInfoError } = await (supabase as any)
          .from('tenant_info')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .single();

        if (tenantInfoData && !tenantInfoError) {
          console.log('🔧 Loading tenant info from database:', { tenantInfoData });
          console.log('🔧 Banner URL from database:', tenantInfoData.banner_url);
          
          const dbConfig: AppConfig = {
            storeName: (currentTenant as any).name || getDefaultConfigForTenant(tenantSlug).storeName,
            storeIcon: tenantInfoData.logo_url || getDefaultConfigForTenant(tenantSlug).storeIcon,
            storeLogoUrl: tenantInfoData.logo_url,
            storeBannerUrl: (tenantInfoData as any).banner_url || null, // Handle missing column gracefully
            storeIconType: tenantInfoData.logo_url ? 'uploaded' : 'predefined',
            storeDescription: tenantInfoData.description,
            storeAddress: tenantInfoData.address,
            storePhone: tenantInfoData.phone,
            storeEmail: tenantInfoData.email,
            storeHours: tenantInfoData.operating_hours,
            autoAcceptOrders: false, // Default value
            requirePhoneVerification: false, // Default value
            allowGuestCheckout: true, // Default value
            minimumOrderAmount: 0, // Default value
            deliveryFee: 0, // Default value
            freeDeliveryThreshold: 0, // Default value
            // Additional restaurant info fields
            rating: undefined,
            reviewCount: undefined,
            estimatedTime: undefined,
            distance: undefined,
            isOpen: undefined,
            // Social media links
            socialMedia: {
              instagram: tenantInfoData.instagram_url,
              tiktok: tenantInfoData.tiktok_url,
              twitter: tenantInfoData.twitter_url,
              facebook: tenantInfoData.facebook_url,
            },
            // Header display settings
            headerDisplaySettings: {
              showDescription: tenantInfoData.show_description ?? true,
              showOperatingHours: tenantInfoData.show_operating_hours ?? true,
              showAddress: tenantInfoData.show_address ?? true,
              showPhone: tenantInfoData.show_phone ?? true,
              showSocialMedia: tenantInfoData.show_social_media ?? true,
            }
          };
          
          console.log('🔧 Loaded config from tenant_info table:', dbConfig);
          setConfig(dbConfig);

          // Also save to localStorage for faster subsequent loads
          const storageKey = `tenant-config-${tenantSlug}`;
          localStorage.setItem(storageKey, JSON.stringify(dbConfig));

          return;
        }
      }

      // For public pages, try to load tenant data by slug
      if (!user) {
        try {
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', tenantSlug)
            .single();

          if (tenantData && !tenantError) {
            // Then get tenant info
            const { data: tenantInfoData, error: tenantInfoError } = await (supabase as any)
              .from('tenant_info')
              .select('*')
              .eq('tenant_id', (tenantData as any).id)
              .single();

            if (tenantInfoData && !tenantInfoError) {
              console.log('🔧 Loading tenant info for public page:', { tenantInfoData });
              console.log('🔧 Banner URL from database (public):', tenantInfoData.banner_url);
              
            const dbConfig: AppConfig = {
                storeName: (tenantData as any).name || getDefaultConfigForTenant(tenantSlug).storeName,
                storeIcon: tenantInfoData.logo_url || getDefaultConfigForTenant(tenantSlug).storeIcon,
                storeLogoUrl: tenantInfoData.logo_url,
                storeBannerUrl: (tenantInfoData as any).banner_url || null, // Handle missing column gracefully
                storeIconType: tenantInfoData.logo_url ? 'uploaded' : 'predefined',
                storeDescription: tenantInfoData.description,
                storeAddress: tenantInfoData.address,
                storePhone: tenantInfoData.phone,
                storeEmail: tenantInfoData.email,
                storeHours: tenantInfoData.operating_hours,
                autoAcceptOrders: false, // Default value
                requirePhoneVerification: false, // Default value
                allowGuestCheckout: true, // Default value
                minimumOrderAmount: 0, // Default value
                deliveryFee: 0, // Default value
                freeDeliveryThreshold: 0, // Default value
              // Additional restaurant info fields
                rating: undefined,
                reviewCount: undefined,
                estimatedTime: undefined,
                distance: undefined,
                isOpen: undefined,
              // Social media links
                socialMedia: {
                  instagram: tenantInfoData.instagram_url,
                  tiktok: tenantInfoData.tiktok_url,
                  twitter: tenantInfoData.twitter_url,
                  facebook: tenantInfoData.facebook_url,
                },
              // Header display settings
                headerDisplaySettings: {
                  showDescription: tenantInfoData.show_description ?? true,
                  showOperatingHours: tenantInfoData.show_operating_hours ?? true,
                  showAddress: tenantInfoData.show_address ?? true,
                  showPhone: tenantInfoData.show_phone ?? true,
                  showSocialMedia: tenantInfoData.show_social_media ?? true,
                }
            };
            
            setConfig(dbConfig);

            // Also save to localStorage for faster subsequent loads
            const storageKey = `tenant-config-${tenantSlug}`;
            localStorage.setItem(storageKey, JSON.stringify(dbConfig));

            return;
            }
          }
        } catch (error) {
          logger.error('Error loading tenant data for public page:', error as any);
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
          logger.error('Error loading tenant config from localStorage:', error as any);
          setConfig(getDefaultConfigForTenant(tenantSlug));
        }
      } else {
        setConfig(getDefaultConfigForTenant(tenantSlug));
      }
    } catch (error) {
      logger.error('Error loading config:', error as any);
      setConfig(getDefaultConfigForTenant(tenantSlug));
    } finally {
      setLoading(false);
    }
  };

  // Save config to database and localStorage
  const saveConfig = async (tenantSlug: string, newConfig: AppConfig) => {
    try {
      console.log('🔧 saveConfig called with:', { tenantSlug, newConfig, user: !!user, currentTenant: !!currentTenant });
      // Save to database if user is authenticated
      if (user && currentTenant) {
        // Update tenants table with storeName
        console.log('🔧 Checking storeName update:', {
          newStoreName: newConfig.storeName,
          currentTenantName: currentTenant.name,
          shouldUpdate: newConfig.storeName && newConfig.storeName !== currentTenant.name
        });
        
        if (newConfig.storeName && newConfig.storeName !== currentTenant.name) {
          console.log('🔧 Updating tenants table with storeName:', newConfig.storeName);
          console.log('🔧 Tenant ID:', currentTenant.id);
          
          const { data: updateResult, error: tenantUpdateError } = await (supabase as any)
            .from('tenants')
            .update({ 
              name: newConfig.storeName,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentTenant.id)
            .select();

          console.log('🔧 Update result:', { updateResult, tenantUpdateError });

          if (tenantUpdateError) {
            console.error('❌ Error saving storeName to tenants table:', tenantUpdateError);
            logger.error('Error saving storeName to tenants table:', tenantUpdateError);
          } else {
            console.log('✅ Successfully saved storeName to tenants table');
            console.log('✅ Updated tenant data:', updateResult);
            // Verify the update by fetching the data again
            try {
              // Wait a moment for database consistency
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Fetch the updated tenant data from database to verify
              const { data: updatedTenant, error: fetchError } = await (supabase as any)
          .from('tenants')
                .select('*')
          .eq('id', currentTenant.id)
          .single();

              if (!fetchError && updatedTenant) {
                console.log('🔧 Verification - Fetched tenant data from DB:', updatedTenant);
                console.log('🔧 Verification - Expected name:', newConfig.storeName);
                console.log('🔧 Verification - Actual name in DB:', updatedTenant.name);
                console.log('🔧 Verification - Names match:', updatedTenant.name === newConfig.storeName);
                
                if (updatedTenant.name === newConfig.storeName) {
                  console.log('✅ VERIFICATION SUCCESS: Store name correctly saved to database');
                  // Update the currentTenant object in memory
                  (currentTenant as any).name = updatedTenant.name;
                  console.log('🔧 Updated currentTenant.name in memory:', currentTenant.name);
                  
                  // Trigger a re-render by updating the config state
                  setConfig(prevConfig => ({
                    ...prevConfig,
                    storeName: updatedTenant.name
                  }));
                } else {
                  console.error('❌ VERIFICATION FAILED: Store name not saved correctly to database');
                }
              } else {
                console.error('❌ Could not verify update:', fetchError);
              }
            } catch (fetchError) {
              console.warn('⚠️ Could not verify updated tenant data:', fetchError);
            }
          }
        } else {
          console.log('🔧 No storeName update needed:', {
            reason: !newConfig.storeName ? 'no new storeName' : 'storeName unchanged'
          });
        }

        // Prepare tenant_info data
        const tenantInfoData = {
          tenant_id: currentTenant.id,
            description: newConfig.storeDescription,
            address: newConfig.storeAddress,
            phone: newConfig.storePhone,
            email: newConfig.storeEmail,
            operating_hours: newConfig.storeHours,
          logo_url: newConfig.storeLogoUrl,
          ...(newConfig.storeBannerUrl && { banner_url: newConfig.storeBannerUrl }), // Only include if column exists
          website: null, // Not used in form yet
          category: null, // Not used in form yet
          currency: 'IDR', // Default
          language: 'id', // Default
          instagram_url: newConfig.socialMedia?.instagram,
          tiktok_url: newConfig.socialMedia?.tiktok,
          twitter_url: newConfig.socialMedia?.twitter,
          facebook_url: newConfig.socialMedia?.facebook,
          show_description: newConfig.headerDisplaySettings?.showDescription ?? true,
          show_operating_hours: newConfig.headerDisplaySettings?.showOperatingHours ?? true,
          show_address: newConfig.headerDisplaySettings?.showAddress ?? true,
          show_phone: newConfig.headerDisplaySettings?.showPhone ?? true,
          show_social_media: newConfig.headerDisplaySettings?.showSocialMedia ?? true,
          updated_at: new Date().toISOString()
        };

        console.log('🔧 Updating tenant_info table with data:', tenantInfoData);
        
        // Use upsert to insert or update tenant_info
          const { error: updateError } = await (supabase as any)
          .from('tenant_info')
          .upsert(tenantInfoData, { 
            onConflict: 'tenant_id',
            ignoreDuplicates: false 
          });

          if (updateError) {
          console.error('❌ Error saving config to tenant_info table:', updateError);
          logger.error('Error saving config to tenant_info table:', updateError);
            // Continue with localStorage fallback
        } else {
          console.log('✅ Successfully saved config to tenant_info table');
        }
      }

      // Always save to localStorage for immediate availability
      const storageKey = `tenant-config-${tenantSlug}`;
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } catch (error) {
      logger.error('Error saving config:', error as any);
    }
  };

  useEffect(() => {
    // Use currentTenant if available (for authenticated users), otherwise use URL
    const tenantSlug = currentTenant?.slug || getTenantSlugFromUrl();
    loadConfig(tenantSlug);
  }, [currentTenant, user]);

  const updateConfig = useMemo(() => async (newConfig: Partial<AppConfig>) => {
    console.log('🔧 updateConfig called with:', { newConfig, tenantSlug: currentTenant?.slug || getTenantSlugFromUrl(), currentTenant: !!currentTenant });
    
    // Use currentTenant if available (for authenticated users), otherwise use URL
    const tenantSlug = currentTenant?.slug || getTenantSlugFromUrl();
    
    const updatedConfig = { ...config, ...newConfig };
    console.log('🔧 Updated config:', updatedConfig);
    setConfig(updatedConfig);

    // Save to both database and localStorage
    await saveConfig(tenantSlug, updatedConfig as AppConfig);
    console.log('🔧 Config saved successfully');
  }, [config, currentTenant]);

  // Ensure we always provide a valid context value
  const contextValue = useMemo(() => ({
      config,
      updateConfig,
      loading
  }), [config, loading]);

  return (
    <ConfigContext.Provider value={contextValue}>
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
