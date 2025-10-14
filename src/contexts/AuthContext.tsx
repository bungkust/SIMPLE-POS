'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
// Removed secureAuth import - using Supabase Auth directly

interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  currentTenant: Tenant | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isTenantOwner: boolean;
  // Secure permission checking
  checkPermission: (permission: 'super_admin' | 'tenant_admin' | 'tenant_access') => Promise<boolean>;
  validateAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userRole, setUserRole] = useState<'super_admin' | 'tenant' | null>(null);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AUTH: Starting authentication...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Authentication failed');
    }

    console.log('✅ AUTH: Authentication successful');
    
    // Update state with validated data
    setUser(data.user);
    
    // Load tenant data if user is authenticated
    if (data.user) {
      await loadTenantData(data.user);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    console.log('🔐 AUTH: Starting logout...');
    
    // Use Supabase logout
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    
    // Clear all state
    setUser(null);
    setSession(null);
    setCurrentTenant(null);
    setUserRole(null);
    
    console.log('✅ AUTH: Logout successful');
  };

  // Load tenant data for authenticated user
  const loadTenantData = async (user: User) => {
    try {
      console.log('🔐 AUTH: Loading tenant data...');
      
      // Get user role from user_roles table
      const { data: userRoleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        console.error('❌ AUTH: Role validation failed:', roleError);
        setUserRole(null);
        setCurrentTenant(null);
        return;
      }

      console.log('✅ AUTH: Role validation successful');
      
      // Update state with validated data
      setUserRole(userRoleData.role);
      
      // Load tenant data if user is a tenant
      if (userRoleData.role === 'tenant') {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('id, name, slug, owner_email')
          .eq('owner_email', user.email)
          .single();

        if (tenantError) {
          console.error('❌ AUTH: Failed to load tenant data:', tenantError);
          setCurrentTenant(null);
        } else {
          setCurrentTenant(tenantData);
        }
      } else {
        setCurrentTenant(null);
      }
      
    } catch (error) {
      console.error('❌ AUTH: Role validation error:', error);
      setUserRole(null);
      setCurrentTenant(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            await loadTenantData(session.user);
          }, 0);
        } else {
          setCurrentTenant(null);
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        loadTenantData(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Permission checking functions
  const checkPermission = async (permission: 'super_admin' | 'tenant_admin' | 'tenant_access'): Promise<boolean> => {
    try {
      if (!user || !userRole) return false;
      
      switch (permission) {
        case 'super_admin':
          return userRole === 'super_admin';
        case 'tenant_admin':
        case 'tenant_access':
          return userRole === 'tenant';
        default:
          return false;
      }
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  };

  const validateAuth = async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session?.user;
    } catch (error) {
      console.error('Auth validation error:', error);
      return false;
    }
  };

  // Computed values (client-side for UI, but always validated server-side)
  const isAuthenticated = !!user;
  const isSuperAdmin = userRole === 'super_admin';
  const isTenantOwner = userRole === 'tenant' && !!currentTenant;

  const value: AuthContextType = {
    user,
    session,
    loading,
    currentTenant,
    signIn,
    signInWithGoogle,
    signOut,
    isAuthenticated,
    isSuperAdmin,
    isTenantOwner,
    checkPermission,
    validateAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}