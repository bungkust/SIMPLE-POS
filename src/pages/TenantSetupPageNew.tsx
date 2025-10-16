import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/forms/FormInput';
import { Shield, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppToast } from '@/components/ui/toast-provider';
import { tenantSetupSchema, type TenantSetupData } from '@/lib/form-schemas';

export function TenantSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<TenantSetupData>({
    resolver: zodResolver(tenantSetupSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');

  useEffect(() => {
    if (!token) {
      showError('Invalid Setup Link', 'Setup token is missing from the URL.');
      navigate('/');
      return;
    }

    loadTenant();
  }, [token, navigate, showError]);

  const loadTenant = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', token)
        .single();

      if (error) {
        console.error('Error loading tenant:', error);
        showError('Tenant Not Found', 'The setup link is invalid or expired.');
        navigate('/');
        return;
      }

      if (!data) {
        showError('Tenant Not Found', 'The setup link is invalid or expired.');
        navigate('/');
        return;
      }

      setTenant(data);
    } catch (error) {
      console.error('Error loading tenant:', error);
      showError('Error', 'Failed to load tenant information.');
      navigate('/');
    }
  };

  const onSubmit = async (data: TenantSetupData) => {
    if (!tenant) return;

    setLoading(true);
    try {
      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tenant.owner_email,
        password: data.password,
      });

      if (authError) {
        showError('Account Creation Failed', authError.message);
        return;
      }

      if (!authData.user) {
        showError('Account Creation Failed', 'Failed to create user account');
        return;
      }

      console.log('User account created successfully:', authData.user.id);

      // Step 2: Wait a moment for trigger to create role (if it exists)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Update tenant with owner_id using RPC function
      const { data: updateResult, error: tenantError } = await supabase
        .rpc('update_tenant_owner_id', {
          tenant_id: tenant.id,
          user_id: authData.user.id
        });

      if (tenantError) {
        console.error('RPC error:', tenantError);
        showError('Setup Failed', 'Failed to link tenant: ' + tenantError.message);
        return;
      }

      if (!updateResult?.success) {
        console.error('Update failed:', updateResult);
        showError('Setup Failed', 'Failed to link tenant: ' + (updateResult?.error || 'Unknown error'));
        return;
      }

      console.log('Tenant owner setup completed successfully:', updateResult);

      // Success - show success message and redirect
      showSuccess('Account Setup Successful!', 'You can now login to your admin dashboard.');
      setTimeout(() => {
        navigate(`/${tenant.slug}/admin/login`);
      }, 2000);

    } catch (err: any) {
      console.error('Setup error:', err);
      showError('Setup Failed', 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading tenant information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Setup Your Account
            </CardTitle>
            <CardDescription>
              Complete your account setup for <strong>{tenant.name}</strong>
            </CardDescription>
            <div className="text-sm text-muted-foreground">
              Email: {tenant.owner_email}
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <div className="relative">
                <FormInput
                  {...register('confirmPassword')}
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  error={errors.confirmPassword?.message}
                  required
                  disabled={loading}
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-8 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Password strength:</div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((level) => {
                      let color = 'bg-gray-200';
                      if (password.length >= 6 && password.length < 8) {
                        color = level <= 1 ? 'bg-red-500' : 'bg-gray-200';
                      } else if (password.length >= 8 && password.length < 12) {
                        color = level <= 2 ? 'bg-yellow-500' : 'bg-gray-200';
                      } else if (password.length >= 12) {
                        color = level <= 3 ? 'bg-green-500' : 'bg-gray-200';
                      }
                      
                      return (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded ${color}`}
                        />
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {password.length < 6 && 'Password must be at least 6 characters'}
                    {password.length >= 6 && password.length < 8 && 'Weak password'}
                    {password.length >= 8 && password.length < 12 && 'Good password'}
                    {password.length >= 12 && 'Strong password'}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                By completing setup, you agree to the terms of service.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
