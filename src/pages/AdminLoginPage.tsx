import { useState, useEffect } from 'react';
import { ArrowLeft, Coffee, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminLoginPageProps {
  onBack: () => void;
}

export function AdminLoginPage({ onBack }: AdminLoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'google'>('email');
  const [tenantInfo, setTenantInfo] = useState<{ name: string; slug: string } | null>(null);

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Get tenant information from URL path
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const tenantSlug = pathParts.length > 0 ? pathParts[0] : 'kopipendekar';

    // For now, set mock tenant info based on slug
    // In production, this would query the database
    const tenantInfoMap: Record<string, { name: string; slug: string }> = {
      kopipendekar: { name: 'Kopi Pendekar', slug: 'kopipendekar' }
    };

    setTenantInfo(tenantInfoMap[tenantSlug] || { name: 'Tenant', slug: tenantSlug });
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Silakan masukkan email dan password');
      return;
    }

    setLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting email login for:', email);
      }

      // Simple email login without complex auth context
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Supabase auth error:', error);
        }
        throw new Error(`Login gagal: ${error.message}`);
      }

      if (data.user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Login successful, redirecting...');
        }

        // Get tenant slug and redirect
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const tenantSlug = pathParts.length > 0 ? pathParts[0] : 'kopipendekar';
        window.location.href = `/${tenantSlug}/admin/dashboard`;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Email login error:', error);
      }
      alert(error instanceof Error ? error.message : 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Get tenant slug from current URL path
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const tenantSlug = pathParts.length > 0 ? pathParts[0] : 'kopipendekar';

      const redirectTo = `${window.location.origin}/${tenantSlug}/admin/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo
        }
      });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Google login error:', error);
        }
        alert('Gagal login dengan Google. Silakan coba lagi.');
      }
      // OAuth will handle redirect automatically
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Google login error:', error);
      }
      alert('Terjadi kesalahan saat login dengan Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Kembali</span>
          </button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coffee className="w-8 h-8 text-green-500" />
            <h1 className="text-2xl font-bold text-slate-900">
              {tenantInfo ? tenantInfo.name : 'Loading...'}
            </h1>
          </div>
          <p className="text-slate-600">Login Admin</p>
          {tenantInfo && (
            <p className="text-sm text-slate-500 mt-1">
              Tenant: {tenantInfo.name} ({tenantInfo.slug})
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Login Method Toggle */}
          <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === 'email'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </button>
            <button
              onClick={() => setLoginMethod('google')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === 'google'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>

          {loginMethod === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-slate-600 text-sm">
                  Login dengan email untuk mengakses dashboard admin {tenantInfo?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="admin@tenant.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {loading ? 'Login...' : 'Login dengan Email'}
              </button>

              <p className="text-xs text-slate-500 text-center mt-4">
                Pastikan email Anda terdaftar sebagai admin untuk {tenantInfo?.name}
              </p>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-slate-600 text-sm mb-4">
                Login dengan Google untuk mengakses dashboard admin {tenantInfo?.name}
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Menghubungkan ke Google...' : 'Login dengan Google'}
              </button>

              <p className="text-xs text-slate-500 mt-4">
                Pastikan email Google Anda terdaftar sebagai admin untuk {tenantInfo?.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}