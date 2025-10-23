import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

import { logger } from '@/lib/logger';
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireAuth = false
}: ProtectedRouteProps) {
  // Get auth context safely
  let authContext = { 
    user: null, 
    loading: false, 
    isTenantOwner: false, 
    isSuperAdmin: false, 
    checkPermission: async () => false, 
    validateAuth: async () => false, 
    signOut: async () => {} 
  };
  try {
    authContext = useAuth();
  } catch (error) {
    console.warn('Auth context not available in ProtectedRoute:', error);
  }
  
  const { user, loading, isTenantOwner, isSuperAdmin, checkPermission, validateAuth, signOut } = authContext;
  const [hasChecked, setHasChecked] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [permissionValidated, setPermissionValidated] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // SECURITY FIX: Server-side permission validation
  useEffect(() => {
    const validatePermissions = async () => {
      if (!loading && user) {
        setAuthLoading(true);
        try {
          logger.log('🔐 SECURE AUTH: Validating permissions server-side...');
          
          // Validate authentication first
          const isAuthValid = await validateAuth();
          if (!isAuthValid) {
            logger.error('❌ SECURE AUTH: Authentication validation failed');
            setHasPermission(false);
            setPermissionValidated(true);
            setAuthLoading(false);
            return;
          }

          // Check specific permissions based on requirements
          let permission = '';
          if (requireSuperAdmin) {
            permission = 'super_admin';
          } else if (requireAdmin) {
            permission = 'tenant_admin';
          } else if (requireAuth) {
            permission = 'tenant_access';
          }

          if (permission) {
            const hasRequiredPermission = await checkPermission(permission as any);
            logger.log(`🔐 SECURE AUTH: Permission ${permission}:`, hasRequiredPermission);
            setHasPermission(hasRequiredPermission);
          } else {
            setHasPermission(true); // No specific permission required
          }

          setPermissionValidated(true);
        } catch (error) {
          logger.error('❌ SECURE AUTH: Permission validation error:', error);
          setHasPermission(false);
          setPermissionValidated(true);
        } finally {
          setAuthLoading(false);
        }
      } else if (!loading && !user) {
        // No user, no permissions needed
        setHasPermission(false);
        setPermissionValidated(true);
      }
    };

    validatePermissions();
  }, [loading, user, requireSuperAdmin, requireAdmin, requireAuth, checkPermission, validateAuth]);

  useEffect(() => {
    if (!loading) {
      setHasChecked(true);
    }
  }, [loading]);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      // Use environment-specific redirect URLs for production compatibility
      const isProduction = process.env.NODE_ENV === 'production';
      const currentOrigin = isProduction
        ? import.meta.env.VITE_SITE_URL || window.location.origin
        : window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${currentOrigin}/sadmin/dashboard`
        }
      });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Google login error:', error);
        }
        alert('Gagal login dengan Google. Silakan coba lagi.');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Google login error:', error);
      }
      alert('Terjadi kesalahan saat login dengan Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading || !hasChecked || !permissionValidated || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">
            {authLoading ? 'Validating permissions...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Authentication Required</h2>
          <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">Please log in to access this page.</p>

          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full bg-white border border-slate-300 text-slate-700 py-3 sm:py-4 px-4 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 mb-4 touch-manipulation min-h-[48px]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm sm:text-base">{authLoading ? 'Menghubungkan ke Google...' : 'Login dengan Google'}</span>
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="text-slate-600 hover:text-slate-900 text-sm touch-manipulation"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // SECURITY FIX: Use server-validated permissions instead of client-side checks
  // Check super admin requirement
  if (requireSuperAdmin && !hasPermission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Access Denied</h2>
          <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">You don't have super admin privileges to access this page.</p>

          {user ? (
            // User is authenticated but not super admin
            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-3 sm:mb-4">
                Your account ({user.email}) doesn't have super admin privileges.
              </p>
              <p className="text-xs text-slate-400">
                Contact your system administrator for super admin access.
              </p>
            </div>
          ) : (
            // User is not authenticated
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full bg-white border border-slate-300 text-slate-700 py-3 sm:py-4 px-4 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 mb-4 touch-manipulation min-h-[48px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm sm:text-base">{authLoading ? 'Menghubungkan ke Google...' : 'Login dengan Google'}</span>
            </button>
          )}

          <button
            onClick={() => window.location.href = '/'}
            className="text-slate-600 hover:text-slate-900 text-sm touch-manipulation"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !hasPermission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Access Error</h2>
          <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">You don't have permission to access this tenant dashboard.</p>

          {user ? (
            // User is authenticated but no tenant data
            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-3 sm:mb-4">
                Your account ({user.email}) doesn't have a tenant associated with it.
              </p>
              <p className="text-xs text-slate-400 mb-4">
                This usually means your account hasn't been set up with a tenant yet.
              </p>
              
              {/* Add logout button */}
              <button
                onClick={async () => {
                  await signOut();
                  window.location.href = '/';
                }}
                className="w-full bg-red-600 text-white py-3 sm:py-4 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 mb-4 touch-manipulation min-h-[48px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm sm:text-base">Logout</span>
              </button>
            </div>
          ) : (
            // User is not authenticated
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full bg-white border border-slate-300 text-slate-700 py-3 sm:py-4 px-4 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 mb-4 touch-manipulation min-h-[48px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm sm:text-base">{authLoading ? 'Menghubungkan ke Google...' : 'Login dengan Google'}</span>
            </button>
          )}

          <button
            onClick={() => window.location.href = '/'}
            className="text-slate-600 hover:text-slate-900 text-sm touch-manipulation"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
