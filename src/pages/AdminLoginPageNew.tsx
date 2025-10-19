import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/forms/FormInput';
import { ArrowLeft, Coffee, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppToast } from '@/components/ui/toast-provider';
import { loginSchema, type LoginData } from '@/lib/form-schemas';
import { User, Session } from '@supabase/supabase-js';
import { useIsMobile } from '@/hooks/use-media-query';

interface AdminLoginPageProps {
  onBack: () => void;
}

export function AdminLoginPage({ onBack }: AdminLoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isMobile = useIsMobile();

  const isSuperAdmin = location.pathname === '/super-admin/login';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            await checkUserRoleAndRedirect(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkUserRoleAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserRoleAndRedirect = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_access_status', {
        user_id: userId
      });

      if (error) {
        console.error('Error checking user role:', error);
        return;
      }

      if (data?.is_super_admin) {
        navigate('/super-admin/dashboard');
      } else if (data?.memberships && data.memberships.length > 0) {
        const firstTenant = data.memberships[0];
        navigate(`/${firstTenant.slug}/admin/dashboard`);
      } else {
        showError('Access Denied', 'You don\'t have permission to access this page.');
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error in checkUserRoleAndRedirect:', error);
      showError('Error', 'Failed to verify user permissions.');
    }
  };

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    try {
      console.log('Attempting login with email:', data.email);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      console.log('Login response:', { authData, error });

      if (error) {
        console.error('Login error details:', error);
        
        // Provide more user-friendly error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email atau password salah. Silakan coba lagi.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email belum dikonfirmasi. Silakan periksa email Anda.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.';
        }
        
        showError('Login Gagal', errorMessage);
        return;
      }

      console.log('Login successful, user:', authData.user);
      // The auth state change listener will handle the redirect
    } catch (error) {
      console.error('Unexpected login error:', error);
      showError('Login Error', 'Terjadi kesalahan tak terduga. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center ${isMobile ? 'p-3' : 'p-4'}`}>
      <div className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
        <Card className={`shadow-xl ${isMobile ? 'border-0 shadow-2xl' : ''}`}>
          <CardHeader className={`${isMobile ? 'space-y-2 pb-4' : 'space-y-1'}`}>
            <div className={`flex items-center ${isMobile ? 'flex-col space-y-3' : 'justify-between'}`}>
              <div className={`flex items-center ${isMobile ? 'flex-col space-y-2 text-center' : 'space-x-2'}`}>
                <Coffee className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} text-primary`} />
                <div className={isMobile ? 'space-y-1' : ''}>
                  <CardTitle className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                    {isSuperAdmin ? 'Super Admin' : 'Admin'} Login
                  </CardTitle>
                  <CardDescription className={isMobile ? 'text-sm' : ''}>
                    {isSuperAdmin 
                      ? 'Access the super admin dashboard' 
                      : 'Sign in to your admin account'
                    }
                  </CardDescription>
                </div>
              </div>
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </CardHeader>
          
          <CardContent className={isMobile ? 'px-4 pb-6' : ''}>
            <form onSubmit={handleSubmit(onSubmit)} className={`${isMobile ? 'space-y-6' : 'space-y-4'}`}>
              <FormInput
                {...register('email')}
                label="Email"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                required
                disabled={loading}
                className="w-full"
              />

              <div className="relative">
                <FormInput
                  {...register('password')}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  required
                  disabled={loading}
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute right-0 ${isMobile ? 'top-9 h-9 w-9' : 'top-8 h-8 w-8'} p-0 hover:bg-transparent`}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-muted-foreground`} />
                  ) : (
                    <Eye className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-muted-foreground`} />
                  )}
                </Button>
              </div>

              <Button
                type="submit"
                className={`w-full ${isMobile ? 'h-12 text-base font-medium' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${isMobile ? 'h-5 w-5 mr-2' : 'h-4 w-4 mr-2'}`}></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className={`${isMobile ? 'mt-8' : 'mt-6'} text-center`}>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                Need help? Contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
