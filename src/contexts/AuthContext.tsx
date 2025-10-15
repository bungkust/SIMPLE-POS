'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logger } from '@/lib/logger';
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
  tenantLoading: boolean;
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
  const [loadingTenantData, setLoadingTenantData] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    logger.log('🔐 AUTH: Starting authentication...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Authentication failed');
    }

    logger.log('✅ AUTH: Authentication successful');
    
    // Update state with validated data
    setUser(data.user);
    
    // Load tenant data if user is authenticated
    if (data.user) {
      await loadTenantData(data.user);
    }
  };

  const signInWithGoogle = async () => {
    const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${baseUrl}${window.location.pathname}`
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    logger.log('🔐 AUTH: Starting logout...');
    
    // Use Supabase logout
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('Logout error:', error);
    }
    
    // Clear all state
    setUser(null);
    setSession(null);
    setCurrentTenant(null);
    setUserRole(null);
    
    logger.log('✅ AUTH: Logout successful');
  };

  // Load tenant data for authenticated user
  const loadTenantData = useCallback(async (user: User) => {
    if (loadingTenantData) {
      logger.log('🔐 AUTH: Already loading tenant data, skipping...');
      return;
    }
    
    try {
      logger.log('🔐 AUTH: Loading tenant data...');
      setLoadingTenantData(true);
      setTenantLoading(true);
      
      // Get user role from user_roles table
      const { data: userRoleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (roleError) {
        logger.error('❌ AUTH: Role validation failed:', roleError);
        setUserRole(null);
        setCurrentTenant(null);
        return;
      }

      if (!userRoleData || userRoleData.length === 0) {
        logger.log('⚠️ AUTH: No role found for user:', user.email);
        setUserRole(null);
        setCurrentTenant(null);
        return;
      }

      logger.log('✅ AUTH: Role validation successful');
      
      // Update state with validated data
      setUserRole(userRoleData[0].role);
      
      // Load tenant data if user is a tenant
      if (userRoleData[0].role === 'tenant') {
        logger.log('🔍 AUTH: Loading tenant data for email:', user.email);
        logger.log('🔍 AUTH: User ID:', user.id);
        
        // Try multiple approaches to find tenant
        let tenantData = null;
        let tenantError = null;
        
        // Debug: List all tenants to see what's available
        const { data: allTenants, error: allTenantsError } = await supabase
          .from('tenants')
          .select('id, name, slug, owner_email, owner_id');
        
        if (allTenantsError) {
          logger.error('❌ AUTH: Error listing all tenants:', allTenantsError);
        } else {
          logger.log('🔍 AUTH: All tenants in database:', allTenants);
        }
        
        // Approach 1: Find by owner_email
        const { data: tenantByEmail, error: errorByEmail } = await supabase
          .from('tenants')
          .select('id, name, slug, owner_email, owner_id')
          .eq('owner_email', user.email);

        if (errorByEmail) {
          logger.error('❌ AUTH: Error finding tenant by email:', errorByEmail);
        } else if (tenantByEmail && tenantByEmail.length > 0) {
          tenantData = tenantByEmail;
          logger.log('✅ AUTH: Found tenant by email:', tenantByEmail[0]);
        } else {
          logger.log('⚠️ AUTH: No tenant found by email, trying by user_id...');
          
          // Approach 2: Find by owner_id in tenants table
          const { data: tenantByUserId, error: errorByUserId } = await supabase
            .from('tenants')
            .select('id, name, slug, owner_email, owner_id')
            .eq('owner_id', user.id);

          if (errorByUserId) {
            logger.error('❌ AUTH: Error finding tenant by user_id:', errorByUserId);
          } else if (tenantByUserId && tenantByUserId.length > 0) {
            tenantData = tenantByUserId;
            logger.log('✅ AUTH: Found tenant by user_id:', tenantByUserId[0]);
          } else {
            logger.log('⚠️ AUTH: No tenant found by user_id either');
          }
        }

        if (tenantData && tenantData.length > 0) {
          setCurrentTenant(tenantData[0]);
        } else {
          logger.log('⚠️ AUTH: No tenant found for user:', user.email);
          setCurrentTenant(null);
        }
      } else {
        setCurrentTenant(null);
      }
      
    } catch (error) {
      logger.error('❌ AUTH: Role validation error:', error);
      setUserRole(null);
      setCurrentTenant(null);
    } finally {
      setLoadingTenantData(false);
      setTenantLoading(false);
    }
  }, [loadingTenantData]); // Add loadingTenantData to dependency array

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
      logger.error('Permission check error:', error);
      return false;
    }
  };

  const validateAuth = async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session?.user;
    } catch (error) {
      logger.error('Auth validation error:', error);
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
    tenantLoading,
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