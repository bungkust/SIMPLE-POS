import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function TenantSetupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      loadTenantInfo();
    }
  }, [token]);

  const loadTenantInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', token)
        .single();

      if (error) {
        setError('Invalid invitation token');
        return;
      }

      setTenant(data);
    } catch (err) {
      setError('Failed to load tenant information');
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tenant.owner_email,
        password: formData.password,
      });

      if (authError) {
        setError('Failed to create account: ' + authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to create account');
        setLoading(false);
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
        setError('Failed to link tenant: ' + tenantError.message);
        setLoading(false);
        return;
      }

      if (!updateResult?.success) {
        console.error('Update failed:', updateResult);
        setError('Failed to link tenant: ' + (updateResult?.error || 'Unknown error'));
        setLoading(false);
        return;
      }

      console.log('Tenant owner setup completed successfully:', updateResult);

      // Success - redirect to login
      alert('Account setup successful! You can now login.');
      navigate(`/${tenant.slug}/admin/login`);

    } catch (err: any) {
      console.error('Setup error:', err);
      setError('Setup failed. Please try again.');
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Invalid Invitation</h1>
          <p className="text-slate-600 mb-6">This invitation link is invalid or expired.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Setup Your Account</h1>
          <p className="text-slate-600">Complete your account setup for</p>
          <p className="font-semibold text-purple-600">{tenant.name}</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={tenant.owner_email}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Confirm your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            After setup, you can login at{' '}
            <span className="font-mono text-purple-600">/{tenant.slug}/admin/login</span>
          </p>
        </div>
      </div>
    </div>
  );
}
