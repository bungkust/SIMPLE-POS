import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Coffee, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { User, Session } from '@supabase/supabase-js';

export function AdminLoginPage({ onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const isSuperAdmin = location.pathname === '/super-admin/login';

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
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (roleError) {
      console.error('Error fetching user roles:', roleError);
      return;
    }

    if (roleData && roleData.length > 0) {
      // If user has multiple roles, prioritize super_admin
      const hasSuperAdmin = roleData.some(role => role.role === 'super_admin');
      const hasTenant = roleData.some(role => role.role === 'tenant');
      
      if (hasSuperAdmin) {
        navigate('/super-admin/dashboard');
      } else if (hasTenant) {
        // Get user's tenant domain for slug-based routing
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('slug')
          .eq('owner_id', userId)
          .single();

        if (tenantError) {
          console.error('Error fetching tenant data:', tenantError);
          navigate('/tenant/dashboard');
        } else if (tenantData?.slug) {
          navigate(`/${tenantData.slug}/dashboard`);
        } else {
          // Fallback to old URL if no domain found
          navigate('/tenant/dashboard');
        }
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        if (roleError) {
          console.error('Error fetching user roles:', roleError);
          toast.error('Error checking user role. Please try again.');
          await supabase.auth.signOut();
          return;
        }

        if (roleData && roleData.length > 0) {
          // If user has multiple roles, prioritize super_admin
          const hasSuperAdmin = roleData.some(role => role.role === 'super_admin');
          const hasTenant = roleData.some(role => role.role === 'tenant');
          
          if (hasSuperAdmin) {
            navigate('/super-admin/dashboard');
          } else if (hasTenant) {
            const { data: tenantData, error: tenantError } = await supabase
              .from('tenants')
              .select('slug')
              .eq('owner_id', data.user.id)
              .single();

            if (tenantError) {
              console.error('Error fetching tenant data:', tenantError);
              navigate('/tenant/dashboard');
            } else if (tenantData?.slug) {
              navigate(`/${tenantData.slug}/dashboard`);
            } else {
              navigate('/tenant/dashboard');
            }
          }
        } else {
          toast.error('User role not found. Please contact administrator.');
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`
        }
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Coffee className="h-12 w-12 text-slate-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isSuperAdmin ? 'Super Admin Login' : 'Admin Login'}
          </h1>
          <p className="text-slate-600 mt-2">
            {isSuperAdmin 
              ? 'Access the super admin dashboard' 
              : 'Access your tenant dashboard'
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}