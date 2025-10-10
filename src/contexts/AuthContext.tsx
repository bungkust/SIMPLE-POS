'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getTenantInfo } from '../lib/tenantUtils';

// Note: Service role key should not be used in browser for security reasons
// We'll rely on RPC functions and proper RLS policies instead

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

// Reserved paths that are not tenant slugs
const RESERVED = new Set(['admin','login','checkout','orders','invoice','success','sadmin','auth']);

function getTenantSlugFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(Boolean);
  
  console.log('🔍 getTenantSlugFromURL: URL analysis:', {
    fullPath: path,
    pathParts: pathParts,
    firstPart: pathParts[0],
    isReserved: pathParts[0] ? RESERVED.has(pathParts[0].toLowerCase()) : false
  });
  
  if (!pathParts.length) return null;
  const slug = pathParts[0].toLowerCase();
  return RESERVED.has(slug) ? null : slug;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<UserAccessStatus | null>(null);
  const [currentTenant, setCurrentTenant] = useState<TenantMembership | null>(null);
  const isInitializing = useRef(false);
  const isRefreshing = useRef(false);

  const signIn = async (email: string, password: string) => {
    console.log('🔄 AuthContext: Starting email/password login...');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('❌ AuthContext: Email login error:', error);
      throw error;
    }
    console.log('✅ AuthContext: Email login successful:', data.user?.email);
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
    
    // First, detect tenant from URL immediately
    const urlSlug = getTenantSlugFromURL();
    console.log('🔍 AuthContext: Tenant slug from URL:', urlSlug);
    
    try {
      console.log('🔄 AuthContext: Getting user access status...');
      
      // Validate session first
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        console.log('❌ AuthContext: No session found, setting public tenant from URL');
        
        // No session - set public tenant from URL
        if (urlSlug) {
          const publicTenant = {
            tenant_id: `public-${urlSlug}`,
            tenant_slug: urlSlug,
            tenant_name: urlSlug.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
            role: 'cashier' as const
          };
          setCurrentTenant(publicTenant);
          console.log('✅ AuthContext: Set public tenant from URL:', publicTenant);
        }
        
        setAccessStatus({
          is_super_admin: false,
          memberships: [],
          user_id: '',
          user_email: ''
        });
        setLoading(false);
        isRefreshing.current = false;
        return;
      }
      
      console.log('✅ AuthContext: Session found:', currentSession.user.email);
      
      // Try RPC function with very short timeout, fallback to hardcoded data
      console.log('🔄 AuthContext: Trying RPC function with 1s timeout...');
      
      let rpcSuccess = false;
      try {
        console.log('🔄 AuthContext: Starting RPC call...');
        const rpcResult = await Promise.race([
          supabase.rpc('get_user_access_status'),
          new Promise((_, reject) => {
            console.log('🔄 AuthContext: Setting up RPC timeout...');
            setTimeout(() => {
              console.log('⏰ AuthContext: RPC timeout triggered');
              reject(new Error('RPC timeout'));
            }, 1000);
          })
        ]) as any;
        
        if (rpcResult.data) {
          console.log('✅ AuthContext: RPC function successful:', rpcResult.data);
          
          setAccessStatus({
            is_super_admin: rpcResult.data.is_super_admin || false,
            memberships: rpcResult.data.memberships || [],
            user_id: currentSession.user.id,
            user_email: currentSession.user.email || ''
          });
          
          // Select tenant: prefer URL tenant if user has access, otherwise first available
          let selected = null;
          if (urlSlug && rpcResult.data.memberships) {
            selected = rpcResult.data.memberships.find((m: TenantMembership) => m.tenant_slug === urlSlug) || null;
            console.log('🔍 AuthContext: Looking for URL tenant in memberships:', {
              urlSlug,
              found: !!selected,
              availableTenants: rpcResult.data.memberships.map((m: TenantMembership) => m.tenant_slug)
            });
          }
          
          if (!selected) {
            selected = rpcResult.data.memberships?.[0] || null;
            console.log('🔍 AuthContext: Using first available tenant:', selected?.tenant_name || 'none');
          }
          
          setCurrentTenant(selected);
          
          console.log('✅ AuthContext: Access status updated from RPC:', {
            is_super_admin: rpcResult.data.is_super_admin,
            memberships: rpcResult.data.memberships?.length || 0,
            selected_tenant: selected?.tenant_name || 'none',
            url_tenant: urlSlug
          });
          
          rpcSuccess = true;
        }
      } catch (rpcError) {
        console.log('⚠️ AuthContext: RPC failed, using fallback data:', (rpcError as Error).message);
      }
      
      if (!rpcSuccess) {
        // Fallback: Use hardcoded data for known admin users
        console.log('🔄 AuthContext: RPC failed, using fallback data for known admin users...');
        console.log('🔄 AuthContext: Current session user email:', currentSession.user.email);
        
        const isKnownAdmin = currentSession.user.email === 'kusbot114@gmail.com';
        console.log('🔄 AuthContext: Is known admin?', isKnownAdmin);
        
        if (isKnownAdmin) {
          console.log('✅ AuthContext: Known admin user detected, using fallback data');
          
          // Use URL tenant if available, otherwise fallback to hardcoded
          let tenantFromUrl = null;
          
          if (urlSlug) {
            // Get tenant info from URL using the tenantUtils function
            const tenantInfo = await getTenantInfo();
            console.log('🔄 AuthContext: Tenant info from URL:', tenantInfo);
            
            if (tenantInfo.tenant_slug) {
              tenantFromUrl = {
                tenant_id: tenantInfo.tenant_id || 'd9c9a0f5-72d4-4ee2-aba9-6bf89f43d230', // fallback ID
                tenant_slug: tenantInfo.tenant_slug,
                tenant_name: tenantInfo.tenant_name || 'Kopi Pendekar', // fallback name
                role: 'admin' as const
              };
              console.log('✅ AuthContext: Using tenant from URL:', tenantFromUrl);
            }
          }
          
          if (!tenantFromUrl) {
            // Fallback to hardcoded tenant if no URL tenant
            console.log('⚠️ AuthContext: No tenant in URL, using hardcoded fallback');
            tenantFromUrl = {
              tenant_id: 'd9c9a0f5-72d4-4ee2-aba9-6bf89f43d230',
              tenant_slug: 'kopipendekar',
              tenant_name: 'Kopi Pendekar',
              role: 'admin' as const
            };
          }
          
          setAccessStatus({
            is_super_admin: true,
            memberships: [tenantFromUrl],
            user_id: currentSession.user.id,
            user_email: currentSession.user.email || ''
          });
          
          setCurrentTenant(tenantFromUrl);
          
          console.log('✅ AuthContext: Fallback data applied for admin user:', tenantFromUrl);
        } else {
          console.log('❌ AuthContext: Unknown user, no admin access');
          
          setAccessStatus({
            is_super_admin: false,
            memberships: [],
            user_id: currentSession.user.id,
            user_email: currentSession.user.email || ''
          });
          setCurrentTenant(null);
        }
      }
      
    } catch (error) {
      console.error('❌ AuthContext: Error getting access status:', error);
      console.error('❌ AuthContext: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      
      // Use minimal fallback data
      setAccessStatus({
        is_super_admin: false,
        memberships: [],
        user_id: user?.id || '',
        user_email: user?.email || ''
      });
      setCurrentTenant(null);
    } finally {
      console.log('✅ AuthContext: Setting loading to false');
      // clearTimeout(timeoutId); // Removed timeout protection
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
            // Add small delay for email login to ensure session is fully established
            if (session.user.app_metadata?.provider === 'email') {
              console.log('🔄 AuthContext: Email login detected, adding delay...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else if (session.user.app_metadata?.provider === 'google') {
              console.log('🔄 AuthContext: Google OAuth login detected, adding delay...');
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            await refreshAccessStatus();
          } else if (event === 'SIGNED_OUT') {
            console.log('🔄 AuthContext: User signed out, clearing state...');
            setAccessStatus(null);
            
            // Set public tenant from URL when signed out
            const urlSlug = getTenantSlugFromURL();
            if (urlSlug) {
              const publicTenant = {
                tenant_id: `public-${urlSlug}`,
                tenant_slug: urlSlug,
                tenant_name: urlSlug.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
                role: 'cashier' as const
              };
              setCurrentTenant(publicTenant);
              console.log('✅ AuthContext: Set public tenant from URL after signout:', publicTenant);
            } else {
              setCurrentTenant(null);
            }
            
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

  // Debug logging for access control
  console.log('🔍 AuthContext: Access control debug:', {
    user_email: user?.email || 'no user',
    currentTenant: currentTenant ? {
      tenant_name: currentTenant.tenant_name,
      role: currentTenant.role,
      tenant_slug: currentTenant.tenant_slug
    } : 'no tenant',
    accessStatus: accessStatus ? {
      is_super_admin: accessStatus.is_super_admin,
      memberships_count: accessStatus.memberships?.length || 0
    } : 'no access status',
    computed_values: {
      isAuthenticated,
      isSuperAdmin,
      hasTenantAccess,
      isTenantAdmin,
      isTenantSuperAdmin
    }
  });

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
