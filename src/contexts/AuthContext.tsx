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
  signInWithGoogle: () => Promise<void>;
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

      console.log('Login successful for:', email);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo
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
      const { data, error } = await (supabase as any).rpc('get_user_access_status');

      if (error) {
        console.error('Failed to get access status:', error);
        setAccessStatus(null);
        return;
      }

      if (data) {
        setAccessStatus(data);

        // Auto-select tenant from URL if user has access
        const urlSlug = getTenantSlugFromURL();
        if (urlSlug && !currentTenant) {
          // Find matching membership from RPC data (no extra query needed)
          const matchingMembership = data.memberships.find(
            (m: TenantMembership) => m.tenant_slug === urlSlug
          );

          if (matchingMembership) {
            setCurrentTenant(matchingMembership);
          }
        }

        // Set default tenant if none selected
        if (!currentTenant && data.memberships.length > 0) {
          setCurrentTenant(data.memberships[0]);
        }
      }
    } catch (error) {
      console.error('Error refreshing access status:', error);
      setAccessStatus(null);
    }
  };

  // ========================================
  // INITIALIZATION & LISTENERS
  // ========================================

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (currentUser && mounted) {
          setUser(currentUser);
          await refreshAccessStatus();
        } else if (mounted) {
          setUser(null);
          setAccessStatus(null);
          setCurrentTenant(null);

          // Check for tenant-specific URL access (for non-authenticated users)
          const tenantSlug = getTenantSlugFromURL();
          if (tenantSlug) {
            // For non-authenticated users, we can't verify access, so just set a placeholder
            // The actual tenant access will be checked after authentication
            setCurrentTenant({
              tenant_id: '',
              tenant_slug: tenantSlug,
              tenant_name: tenantSlug,
              role: 'cashier'
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setAccessStatus(null);
          setCurrentTenant(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;

        try {
          if (currentUser) {
            setUser(currentUser);
            await refreshAccessStatus();
          } else {
            setUser(null);
            setAccessStatus(null);
            setCurrentTenant(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setUser(null);
          setAccessStatus(null);
          setCurrentTenant(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
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
