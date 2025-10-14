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
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        showError('Login Failed', error.message);
        return;
      }

      // The auth state change listener will handle the redirect
    } catch (error) {
      console.error('Login error:', error);
      showError('Login Error', 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coffee className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {isSuperAdmin ? 'Super Admin' : 'Admin'} Login
                  </CardTitle>
                  <CardDescription>
                    {isSuperAdmin 
                      ? 'Access the super admin dashboard' 
                      : 'Sign in to your admin account'
                    }
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  className="absolute right-0 top-8 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Need help? Contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
