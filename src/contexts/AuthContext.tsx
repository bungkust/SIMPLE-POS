import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  adminRole: string | null;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get tenant slug from URL path
const getTenantSlugFromURL = (): string | null => {
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(Boolean);

  // Check if path starts with tenant slug pattern (not admin, not other routes)
  if (pathParts.length >= 1 && !pathParts[0].includes('admin') && !pathParts[0].includes('login') && pathParts[0] !== 'checkout' && pathParts[0] !== 'orders' && pathParts[0] !== 'invoice' && pathParts[0] !== 'success') {
    return pathParts[0];
  }

  return null;
};

// Resolve tenant by slug (for URL-based access)
const resolveTenantBySlug = async (slug: string): Promise<Tenant | null> => {
  console.log('🔄 resolveTenantBySlug: Resolving tenant for slug:', slug);

  try {
    const { data, error } = await (supabase as any)
      .from('tenants')
      .select('id, name, slug')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    console.log('🔄 resolveTenantBySlug: Query result:', { data, error });

    if (error || !data) {
      console.error('❌ resolveTenantBySlug: Resolution failed:', error);
      return null;
    }

    const result = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      role: 'guest' // Default role for URL-based access
    };

    console.log('✅ resolveTenantBySlug: Success:', result);
    return result;
  } catch (error) {
    console.error('❌ resolveTenantBySlug: Error:', error);
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 AuthContext: Starting initialization...');

    // Prevent double execution in React StrictMode
    let initialized = false;

    const initializeAuth = async () => {
      if (initialized) {
        console.log('🔄 AuthContext: Already initialized, skipping...');
        return;
      }
      initialized = true;

      try {
        setLoading(true);
        console.log('🔄 AuthContext: Getting session...');

        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        console.log('🔄 AuthContext: Session result:', { currentUser: !!currentUser, email: currentUser?.email });

        if (currentUser) {
          console.log('🔄 AuthContext: User found');
          setUser(currentUser);

          // Check if user is super admin
          const isSuperAdmin = await checkSuperAdmin(currentUser.email || '');

          if (isSuperAdmin) {
            console.log('👑 AuthContext: User is super admin');
            setAdminRole('super_admin');
          } else {
            // Check if user has tenant access
            const userTenant = await getUserTenant(currentUser.email || '');
            if (userTenant) {
              setTenant(userTenant);
              setAdminRole(userTenant.role);
              console.log('✅ AuthContext: User tenant set:', userTenant);
            } else {
              // Set guest role if no tenant access
              setTenant(null);
              setAdminRole(null);
              console.log('❓ AuthContext: No tenant access found');
            }
          }
        } else {
          console.log('🔄 AuthContext: No user found');

          // Check if we're on a tenant-specific URL
          const tenantSlug = getTenantSlugFromURL();
          if (tenantSlug) {
            console.log('🔄 AuthContext: Tenant URL detected:', tenantSlug);
            const tenantInfo = await resolveTenantBySlug(tenantSlug);
            if (tenantInfo) {
              setTenant(tenantInfo);
              console.log('✅ AuthContext: Tenant set from URL:', tenantInfo);
            }
          }

          setUser(null);
          setAdminRole(null);
        }
      } catch (error) {
        console.error('❌ AuthContext: Initialization error:', error);
        // Don't set mock data on error - let it fail gracefully
        setUser(null);
        setTenant(null);
        setAdminRole(null);
      } finally {
        console.log('🔄 AuthContext: Setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 AuthContext: Auth state changed:', { event: _event, hasUser: !!session?.user });

      const currentUser = session?.user ?? null;

      if (currentUser) {
        console.log('🔄 AuthContext: Processing authenticated user:', currentUser.email);
        setUser(currentUser);

        // Check if user is super admin
        const isSuperAdmin = await checkSuperAdmin(currentUser.email || '');

        if (isSuperAdmin) {
          console.log('👑 AuthContext: User is super admin');
          setAdminRole('super_admin');
          setTenant(null); // Super admins don't have tenant context
        } else {
          // Get user's tenant information
          const userTenant = await getUserTenant(currentUser.email || '');
          if (userTenant) {
            setTenant(userTenant);
            setAdminRole(userTenant.role);
            console.log('✅ AuthContext: User tenant set from auth change:', userTenant);
          } else {
            setTenant(null);
            setAdminRole(null);
            console.log('❓ AuthContext: No tenant access found for user');
          }
        }
      } else {
        console.log('🔄 AuthContext: User logged out');
        setUser(null);
        setTenant(null);
        setAdminRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      // Check if current user is super admin (this should be checked after OAuth redirect)
      // For now, we'll redirect based on the current implementation
      const redirectTo = `${window.location.origin}/admin/dashboard`;

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
      setTenant(null);
      setAdminRole(null);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Check if user is super admin
  const checkSuperAdmin = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await (supabase as any)
        .from('admin_users')
        .select('role')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return false;
      }

      return data.role === 'super_admin';
    } catch (error) {
      console.error('Error checking super admin:', error);
      return false;
    }
  };

  // Get user's tenant information
  const getUserTenant = async (email: string): Promise<Tenant | null> => {
    try {
      const { data, error } = await (supabase as any)
        .from('tenant_users')
        .select(`
          tenant_id,
          role,
          tenants (
            id,
            name,
            slug
          )
        `)
        .eq('user_email', email)
        .eq('is_active', true)
        .single();

      if (error || !data || !data.tenants) {
        console.log('❌ getUserTenant: No tenant found for user:', email);
        return null;
      }

      const tenantData = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;

      return {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        role: data.role
      };
    } catch (error) {
      console.error('Error getting user tenant:', error);
      return null;
    }
  };

  // Admin check berdasarkan tenant role
  const isAdmin = adminRole !== null && (adminRole === 'admin' || adminRole === 'super_admin');

  // Super admin check
  const isSuperAdmin = adminRole === 'super_admin';

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      loading,
      signIn,
      signInWithGoogle,
      signOut,
      isAdmin,
      adminRole,
      isSuperAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
