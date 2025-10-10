'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userRole, setUserRole] = useState<'super_admin' | 'tenant' | null>(null);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
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
    setUser(null);
    setSession(null);
    setCurrentTenant(null);
    setUserRole(null);
    await supabase.auth.signOut();
  };

  const checkUserRoleAndLoadTenant = async (userId: string) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError) {
        console.error('Error fetching user roles:', roleError);
        setUserRole(null);
        setCurrentTenant(null);
        return;
      }

      if (roleData && roleData.length > 0) {
        // If user has multiple roles, prioritize super_admin
        const hasSuperAdmin = roleData.some(role => role.role === 'super_admin');
        const hasTenant = roleData.some(role => role.role === 'tenant');
        
        if (hasSuperAdmin) {
          setUserRole('super_admin');
          setCurrentTenant(null);
        } else if (hasTenant) {
          setUserRole('tenant');
          
          // Get user's tenant info
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name, slug, domain')
            .eq('owner_id', userId)
            .single();

          if (tenantError) {
            console.error('Error fetching tenant data:', tenantError);
            setCurrentTenant(null);
          } else if (tenantData) {
            setCurrentTenant(tenantData);
          }
        } else {
          setUserRole(null);
          setCurrentTenant(null);
        }
      } else {
        setUserRole(null);
        setCurrentTenant(null);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
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

  // Computed values
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