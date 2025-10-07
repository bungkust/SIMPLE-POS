'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ========================================
// TYPES & INTERFACES
// ========================================

interface TenantMembership {
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'cashier';
}

interface UserAccessStatus {
  is_super_admin: boolean;
  memberships: TenantMembership[];
  user_id: string;
  user_email: string;
}

interface AuthContextType {
  // Authentication State
  user: User | null;
  loading: boolean;

  // Authorization State
  accessStatus: UserAccessStatus | null;
  currentTenant: TenantMembership | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentTenant: (tenant: TenantMembership | null) => void;
  refreshAccessStatus: () => Promise<void>;

  // Computed Properties
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  hasTenantAccess: boolean;
  isTenantAdmin: boolean;
  isTenantSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ========================================
// UTILITY FUNCTIONS
// ========================================

const getTenantSlugFromURL = (): string | null => {
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(Boolean);

  if (pathParts.length >= 1 &&
      !pathParts[0].includes('admin') &&
      !pathParts[0].includes('login') &&
      pathParts[0] !== 'checkout' &&
      pathParts[0] !== 'orders' &&
      pathParts[0] !== 'invoice' &&
      pathParts[0] !== 'success') {
    return pathParts[0];
  }

  return null;
};

// ========================================
// AUTH PROVIDER COMPONENT
// ========================================

export function AuthProvider({ children }: { children: ReactNode }) {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Authorization State
  const [accessStatus, setAccessStatus] = useState<UserAccessStatus | null>(null);
  const [currentTenant, setCurrentTenant] = useState<TenantMembership | null>(null);

  // ========================================
  // AUTHENTICATION FUNCTIONS
  // ========================================

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Email login error:', error);
        throw new Error(`Login gagal: ${error.message}`);
      }

      console.log('Login successful for user:', user?.id?.substring(0, 8) + '...');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    try {
      // Use the actual current origin instead of hardcoded localhost
      const currentOrigin = window.location.origin;
      const defaultRedirect = `${currentOrigin}/sadmin/dashboard`;
      const finalRedirect = redirectTo || defaultRedirect;

      console.log('🔐 OAuth redirect URL:', finalRedirect);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirect
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        throw new Error('Gagal login dengan Google');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setAccessStatus(null);
      setCurrentTenant(null);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // ========================================
  // AUTHORIZATION FUNCTIONS
  // ========================================

  const refreshAccessStatus = async () => {
    try {
      // Skip RPC call for now - use fallback data
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Skipping RPC call, using fallback access data');
      } else {
        console.warn('⚠️ WARNING: Using fallback access data in PRODUCTION - This should not happen!');
      }

      // Create fallback access status (development only - NOT for production)
      const isDev = process.env.NODE_ENV === 'development';
      const fallbackAccessStatus = {
        is_super_admin: isDev ? true : false, // Only super admin in development
        memberships: [
          {
            tenant_id: 'd9c9a0f5-72d4-4ee2-aba9-6bf89f43d230',
            tenant_slug: 'kopipendekar',
            tenant_name: 'Kopi Pendekar',
            role: (isDev ? 'super_admin' : 'admin') as const
          }
        ],
        user_id: user?.id || '',
        user_email: user?.email || ''
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Using fallback access status');
      }
      setAccessStatus(fallbackAccessStatus);

      // Auto-select tenant from URL if user has access
      const urlSlug = getTenantSlugFromURL();
      if (urlSlug && !currentTenant) {
        const matchingMembership = fallbackAccessStatus.memberships.find(
          (m) => m.tenant_slug === urlSlug
        );

        if (matchingMembership) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎯 Auto-selected tenant:', matchingMembership);
          }
          setCurrentTenant(matchingMembership);
        }
      }

      // Set default tenant if none selected
      if (!currentTenant && fallbackAccessStatus.memberships.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 Set default tenant:', fallbackAccessStatus.memberships[0]);
        }
        setCurrentTenant(fallbackAccessStatus.memberships[0]);
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error in refreshAccessStatus:', error);
      }

      // Set minimal fallback access status
      setAccessStatus({
        is_super_admin: false, // No super admin access in production fallback
        memberships: [],
        user_id: user?.id || '',
        user_email: user?.email || ''
      });
    }
  };

  // ========================================
  // INITIALIZATION & LISTENERS
  // ========================================

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 Initializing auth...');
        }
        setLoading(true);

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (currentUser && mounted) {
          if (process.env.NODE_ENV === 'development') {
            console.log('👤 User found:', currentUser.id?.substring(0, 8) + '...');
          }
          setUser(currentUser);
          await refreshAccessStatus();
        } else if (mounted) {
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ No user session found');
          }
          setUser(null);
          setAccessStatus(null);
          setCurrentTenant(null);

          // Check for tenant-specific URL access (for non-authenticated users)
          const tenantSlug = getTenantSlugFromURL();
          if (tenantSlug) {
            setCurrentTenant({
              tenant_id: '',
              tenant_slug: tenantSlug,
              tenant_name: tenantSlug,
              role: 'cashier'
            });
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Auth initialization error:', error);
        }
        if (mounted) {
          setUser(null);
          setAccessStatus(null);
          setCurrentTenant(null);
        }
      } finally {
        if (mounted) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Auth initialization complete');
          }
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Auth state changed:', _event);
        }
        const currentUser = session?.user ?? null;

        try {
          if (currentUser) {
            if (process.env.NODE_ENV === 'development') {
              console.log('👤 Setting user:', currentUser.id?.substring(0, 8) + '...');
            }
            setUser(currentUser);
            await refreshAccessStatus();
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('❌ Clearing user session');
            }
            setUser(null);
            setAccessStatus(null);
            setCurrentTenant(null);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Auth state change error:', error);
          }
          setUser(null);
          setAccessStatus(null);
          setCurrentTenant(null);
        } finally {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Auth state change complete');
          }
          setLoading(false);
        }
      }
    );

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🛑 Cleaning up auth listeners');
      }
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================

  const isAuthenticated = !!user;
  const isSuperAdmin = accessStatus?.is_super_admin ?? false;
  const hasTenantAccess = (accessStatus?.memberships.length ?? 0) > 0;
  const isTenantAdmin = currentTenant?.role === 'admin' || currentTenant?.role === 'super_admin';
  const isTenantSuperAdmin = currentTenant?.role === 'super_admin';

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value: AuthContextType = {
    // Authentication State
    user,
    loading,

    // Authorization State
    accessStatus,
    currentTenant,

    // Actions
    signIn,
    signInWithGoogle,
    signOut,
    setCurrentTenant,
    refreshAccessStatus,

    // Computed Properties
    isAuthenticated,
    isSuperAdmin,
    hasTenantAccess,
    isTenantAdmin,
    isTenantSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ========================================
// HOOK
// ========================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
