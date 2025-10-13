'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { secureAuthenticate, validateSession, secureLogout, hasPermission } from '../lib/secureAuth';

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
    console.log('🔐 SECURE AUTH: Starting secure authentication...');
    
    // Use secure authentication with server-side validation
    const authResult = await secureAuthenticate(email, password);
    
    if (!authResult.success) {
      throw new Error(authResult.error || 'Authentication failed');
    }

    console.log('✅ SECURE AUTH: Authentication successful');
    
    // Update state with validated data
    setUser(authResult.user);
    setUserRole(authResult.role || null);
    
    if (authResult.tenant) {
      setCurrentTenant(authResult.tenant);
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
    console.log('🔐 SECURE AUTH: Starting secure logout...');
    
    // Use secure logout
    await secureLogout();
    
    // Clear all state
    setUser(null);
    setSession(null);
    setCurrentTenant(null);
    setUserRole(null);
    
    console.log('✅ SECURE AUTH: Logout successful');
  };

  // SECURITY FIX: Use secure server-side role validation
  const checkUserRoleAndLoadTenant = async (userId: string) => {
    try {
      console.log('🔐 SECURE AUTH: Validating user role server-side...');
      
      // Use secure role validation
      const authResult = await validateSession();
      
      if (!authResult.success) {
        console.error('❌ SECURE AUTH: Role validation failed:', authResult.error);
        setUserRole(null);
        setCurrentTenant(null);
        return;
      }

      console.log('✅ SECURE AUTH: Role validation successful');
      
      // Update state with server-validated data
      setUserRole(authResult.role || null);
      
      if (authResult.tenant) {
        setCurrentTenant(authResult.tenant);
      } else {
        setCurrentTenant(null);
      }
      
    } catch (error) {
      console.error('❌ SECURE AUTH: Role validation error:', error);
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
            await checkUserRoleAndLoadTenant(session.user.id);
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
        checkUserRoleAndLoadTenant(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // SECURITY FIX: Add secure permission checking functions
  const checkPermission = async (permission: 'super_admin' | 'tenant_admin' | 'tenant_access'): Promise<boolean> => {
    try {
      return await hasPermission(permission);
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  };

  const validateAuth = async (): Promise<boolean> => {
    try {
      const authResult = await validateSession();
      return authResult.success;
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