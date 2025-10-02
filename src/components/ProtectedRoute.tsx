import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireAuth = false
}: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      setHasChecked(true);
    }
  }, [loading]);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin/dashboard`
        }
      });

      if (error) {
        console.error('Google login error:', error);
        alert('Gagal login dengan Google. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      alert('Terjadi kesalahan saat login dengan Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading || !hasChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-green-500 border-t-transparent"></div>
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

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Access Denied</h2>
          <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">You don't have permission to access this page.</p>

          {user ? (
            // User is authenticated but not admin
            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-3 sm:mb-4">
                Your account ({user.email}) doesn't have admin privileges.
              </p>
              <p className="text-xs text-slate-400">
                Only kusbot114@gmail.com has admin access.
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

  return <>{children}</>;
}
