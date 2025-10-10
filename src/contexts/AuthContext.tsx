'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
  user: User | null;
  loading: boolean;
  accessStatus: UserAccessStatus | null;
  currentTenant: TenantMembership | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentTenant: (tenant: TenantMembership | null) => void;
  refreshAccessStatus: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  hasTenantAccess: boolean;
  isTenantAdmin: boolean;
  isTenantSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<UserAccessStatus | null>(null);
  const [currentTenant, setCurrentTenant] = useState<TenantMembership | null>(null);
  const isInitializing = useRef(false);
  const isRefreshing = useRef(false);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback'
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    setUser(null);
    setAccessStatus(null);
    setCurrentTenant(null);
    await supabase.auth.signOut();
  };

  const refreshAccessStatus = async () => {
    if (isRefreshing.current) {
      console.log('🔄 AuthContext: Already refreshing, skipping RPC call');
      return;
    }

    isRefreshing.current = true;
    console.log('🔄 AuthContext: Starting refreshAccessStatus');
    setLoading(true);
    
    try {
      console.log('🔄 AuthContext: Calling get_user_access_status RPC...');
      
      // Try RPC call with retry logic
      let data, error;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const rpcPromise = supabase.rpc('get_user_access_status');
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('RPC timeout after 5 seconds')), 5000)
          );
          
          const result = await Promise.race([rpcPromise, timeoutPromise]) as any;
          data = result.data;
          error = result.error;
          break;
        } catch (retryError) {
          retryCount++;
          console.log(`🔄 AuthContext: RPC attempt ${retryCount} failed:`, retryError);
          
          if (retryCount >= maxRetries) {
            throw retryError;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      if (error) {
        console.error('❌ AuthContext: RPC error:', error);
        throw error;
      }

      console.log('✅ AuthContext: RPC success:', data);
      const status = data as UserAccessStatus;
      setAccessStatus(status);

      // Select first tenant or default
      const selected = status.memberships[0] || null;
      setCurrentTenant(selected);
      
      console.log('✅ AuthContext: Access status updated:', {
        is_super_admin: status.is_super_admin,
        memberships: status.memberships.length,
        selected_tenant: selected?.tenant_name || 'none'
      });
    } catch (error) {
      console.error('❌ AuthContext: RPC error:', error);
      // Use fallback data
      setAccessStatus({
        is_super_admin: false,
        memberships: [],
        user_id: user?.id || '',
        user_email: user?.email || ''
      });
      setCurrentTenant(null);
    } finally {
      console.log('✅ AuthContext: Setting loading to false');
      setLoading(false);
      isRefreshing.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (isInitializing.current) {
        console.log('🔄 AuthContext: Already initializing, skipping');
        return;
      }

      isInitializing.current = true;
      try {
        console.log('🔄 AuthContext: Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthContext: Session error:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        console.log('🔄 AuthContext: Session check result:', session?.user?.email || 'no session');
        
        if (mounted) {
          setUser(session?.user ?? null);

          if (session?.user) {
            console.log('🔄 AuthContext: User found, refreshing access status...');
            await refreshAccessStatus();
          } else {
            console.log('🔄 AuthContext: No user, setting loading to false');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ AuthContext: Init auth error:', error);
        if (mounted) {
          setLoading(false);
        }
      } finally {
        isInitializing.current = false;
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        try {
          console.log('🔄 AuthContext: Auth state change:', event, session?.user?.email || 'no user');
          setUser(session?.user ?? null);

          if (event === 'SIGNED_IN' && session?.user) {
            console.log('🔄 AuthContext: User signed in, refreshing access status...');
            await refreshAccessStatus();
          } else if (event === 'SIGNED_OUT') {
            console.log('🔄 AuthContext: User signed out, clearing state...');
            setAccessStatus(null);
            setCurrentTenant(null);
            setLoading(false);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 AuthContext: Token refreshed');
            // Don't call refreshAccessStatus here to avoid loops
          }
        } catch (error) {
          console.error('❌ AuthContext: Auth state change error:', error);
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array is correct here

  const isAuthenticated = !!user;
  const isSuperAdmin = accessStatus?.is_super_admin ?? false;
  const hasTenantAccess = (accessStatus?.memberships.length ?? 0) > 0;
  const isTenantAdmin = currentTenant?.role === 'admin' || currentTenant?.role === 'super_admin';
  const isTenantSuperAdmin = currentTenant?.role === 'super_admin';

  const value: AuthContextType = {
    user, loading, accessStatus, currentTenant,
    signIn, signInWithGoogle, signOut, setCurrentTenant, refreshAccessStatus,
    isAuthenticated, isSuperAdmin, hasTenantAccess, isTenantAdmin, isTenantSuperAdmin,
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
