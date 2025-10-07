import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Shield, List, Grid3X3, Table, UserPlus, X, LogOut, User, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
type Tenant = {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  domain?: string;
  email_domain?: string;
  settings?: any;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

type TenantAdmin = {
  id: string;
  tenant_id: string;
  user_email: string;
  role: string;
  is_active: boolean;
};

interface SuperAdminDashboardProps {
  onBack: () => void;
}

export function SuperAdminDashboard({ onBack }: SuperAdminDashboardProps) {
  const { signOut, user, accessStatus, loading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantAdmins, setTenantAdmins] = useState<{[tenantId: string]: TenantAdmin[]}>({});
  const [componentLoading, setComponentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 SuperAdminDashboard:', {
        loading,
        user: user?.email,
        isSuperAdmin: accessStatus?.is_super_admin,
        adminRole: accessStatus?.is_super_admin ? 'super_admin' : null
      });
    }

    if (loading) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⏳ Loading auth...');
      }
      return;
    }

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No user found');
      }
      setError('No user found. Silakan login.');
      setComponentLoading(false);
      return;
    }

    if (!accessStatus?.is_super_admin) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⛔ Access denied (not super admin)');
      }
      setError('Access denied (not super admin)');
      setComponentLoading(false);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Access granted, loading tenants...');
    }
    setComponentLoading(false);
    loadTenants();
  }, [user, accessStatus, loading]);

  const loadTenants = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 SuperAdminDashboard: Starting to load tenants...');
      }
      setComponentLoading(true);
      setError(null);

      // Load tenants
      const { data: tenantsData, error: tenantsError } = await (supabase as any)
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantsError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ SuperAdminDashboard: Tenants query error:', tenantsError);
        }
        throw tenantsError;
      }

      const tenants = tenantsData || [];
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ SuperAdminDashboard: Loaded tenants:', tenants.length);
      }
      setTenants(tenants);

      // Load tenant admins for each tenant
      const adminsMap: {[tenantId: string]: TenantAdmin[]} = {};

      for (const tenant of tenants) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 SuperAdminDashboard: Loading admins for tenant:', tenant.name);
        }
        const { data: adminsData, error: adminsError } = await (supabase as any)
          .from('tenant_users')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .limit(1); // Get only the first admin for display

        if (!adminsError && adminsData) {
          adminsMap[tenant.id] = adminsData;
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ SuperAdminDashboard: Loaded admins for tenant:', tenant.name, adminsData.length);
          }
        } else {
          adminsMap[tenant.id] = [];
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ SuperAdminDashboard: No admins found for tenant:', tenant.name);
          }
        }
      }

      setTenantAdmins(adminsMap);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ SuperAdminDashboard: Error loading tenants:', error);
      }
      setError('Failed to load tenants. Please try again.');
    } finally {
      setComponentLoading(false);
    }
  };

  const handleAddTenant = () => {
    setEditingTenant(null);
    setShowTenantForm(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowTenantForm(true);
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tenant "${tenant.name}"?`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('tenants')
        .delete()
        .eq('id', tenant.id);

      if (error) throw error;

      alert('Tenant berhasil dihapus');
      loadTenants();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting tenant:', error);
      }
      alert('Gagal menghapus tenant');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onBack();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign out error:', error);
      }
    }
  };

  if (componentLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-500" />
              <h1 className="text-xl font-bold text-slate-900">Super Admin Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddTenant}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tenant</span>
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">Keluar</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Kelola Tenant</h2>
            <p className="text-sm text-slate-600 mt-1">
              Kelola tenant yang ada di sistem
            </p>
          </div>

          {tenants.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Belum ada tenant</p>
              <button
                onClick={handleAddTenant}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Tambah Tenant Pertama
              </button>
            </div>
          ) : (
            <div className="p-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{tenant.name}</h3>
                          <p className="text-sm text-slate-500">Slug: {tenant.slug}</p>
                          <p className="text-sm text-slate-500">Subdomain: {tenant.subdomain}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tenant.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tenant.is_active ? 'Aktif' : 'Nonaktif'}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleEditTenant(tenant)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm">Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTenant(tenant)}
                          className="flex items-center justify-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-2">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-purple-500" />
                            <div>
                              <h3 className="font-semibold text-slate-900">{tenant.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span>Slug: {tenant.slug}</span>
                                <span>Subdomain: {tenant.subdomain}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  tenant.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {tenant.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTenant(tenant)}
                            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="text-sm">Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteTenant(tenant)}
                            className="flex items-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Tenant</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Slug</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Subdomain</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Domain</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Admin Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-purple-500" />
                              <span className="font-medium text-slate-900">{tenant.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{tenant.slug}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{tenant.subdomain}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {tenant.domain || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {tenantAdmins[tenant.id]?.[0]?.user_email || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              tenant.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {tenant.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => handleEditTenant(tenant)}
                                className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title="Edit Tenant"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTenant(tenant)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete Tenant"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <a
                                href={`/${tenant.subdomain}/admin/login`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                title="Admin Login"
                              >
                                <User className="w-4 h-4" />
                              </a>
                              <a
                                href={`/${tenant.subdomain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                title="User Homepage"
                              >
                                <Home className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tenant Form Modal */}
      {showTenantForm && (
        <TenantFormModal
          tenant={editingTenant}
          onClose={() => {
            setShowTenantForm(false);
            setEditingTenant(null);
            loadTenants();
          }}
        />
      )}
    </div>
  );
}

// Tenant Form Modal Component
function TenantFormModal({
  tenant,
  onClose
}: {
  tenant: Tenant | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    slug: tenant?.slug || '',
    subdomain: tenant?.subdomain || '',
    domain: tenant?.domain || '',
    email_domain: tenant?.email_domain || '',
    is_active: tenant?.is_active ?? true,
  });

  // Tenant admin management state
  const [tenantAdmins, setTenantAdmins] = useState<TenantAdmin[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);

  useEffect(() => {
    if (tenant) {
      loadTenantAdmins();
    }
  }, [tenant]);

  const loadTenantAdmins = async () => {
    if (!tenant) return;

    try {
      const { data, error } = await (supabase as any)
        .from('tenant_users')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      if (error) throw error;
      setTenantAdmins(data || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading tenant admins:', error);
      }
    }
  };

  const handleAddAdmin = async () => {
    if (!tenant || !newAdminEmail.trim() || !newAdminPassword.trim()) return;

    try {
      setLoading(true);

      // First, create user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdminEmail.trim(),
        password: newAdminPassword.trim(),
      });

      if (authError) throw authError;

      if (authData.user) {
        // Then, link user to tenant
        const { error: tenantError } = await (supabase as any)
          .from('tenant_users')
          .insert({
            tenant_id: tenant.id,
            user_id: authData.user.id,
            user_email: newAdminEmail.trim(),
            role: newAdminRole,
            is_active: true,
          });

        if (tenantError) throw tenantError;

        setNewAdminEmail('');
        setNewAdminPassword('');
        setShowAddAdminForm(false);
        loadTenantAdmins();
        alert('Admin berhasil ditambahkan dengan akun baru');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding admin:', error);
      }
      alert(`Gagal menambahkan admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus admin ini?')) return;

    try {
      const { error } = await (supabase as any)
        .from('tenant_users')
        .update({ is_active: false })
        .eq('id', adminId);

      if (error) throw error;

      loadTenantAdmins();
      alert('Admin berhasil dihapus');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error removing admin:', error);
      }
      alert('Gagal menghapus admin');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tenant) {
        // Update existing tenant
        const { error } = await (supabase as any)
          .from('tenants')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenant.id);

        if (error) throw error;
        alert('Tenant berhasil diperbarui');
      } else {
        // Create new tenant
        const { error } = await (supabase as any)
          .from('tenants')
          .insert(formData);

        if (error) throw error;
        alert('Tenant berhasil ditambahkan');
      }

      onClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving tenant:', error);
      }
      alert('Gagal menyimpan tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {tenant ? 'Edit Tenant' : 'Tambah Tenant'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Tenant <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Nama tenant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="tenant-slug"
              />
              <p className="text-xs text-slate-500 mt-1">Hanya huruf kecil, angka, dan tanda hubung</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subdomain <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="tenant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Domain (Opsional)
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="tenant.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Domain (Opsional)
              </label>
              <input
                type="text"
                value={formData.email_domain}
                onChange={(e) => setFormData({ ...formData, email_domain: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="@tenant.com"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-purple-500 border-slate-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="is_active" className="text-sm text-slate-700">
                Tenant Aktif
              </label>
            </div>

            {/* Tenant Admin Management */}
            {tenant && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Kelola Admin Tenant</h4>

                {/* Current Admins */}
                {tenantAdmins.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-2">Admin Saat Ini:</p>
                    <div className="space-y-2">
                      {tenantAdmins.map((admin) => (
                        <div key={admin.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-700">{admin.user_email}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {admin.role}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Admin */}
                {showAddAdminForm ? (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email Admin
                        </label>
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="Email admin baru"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="Password untuk admin"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Role
                        </label>
                        <select
                          value={newAdminRole}
                          onChange={(e) => setNewAdminRole(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="cashier">Cashier</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleAddAdmin}
                        disabled={!newAdminEmail.trim() || !newAdminPassword.trim()}
                        className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        Tambah
                      </button>
                      <button
                        onClick={() => {
                          setShowAddAdminForm(false);
                          setNewAdminEmail('');
                          setNewAdminPassword('');
                        }}
                        className="px-3 py-1 border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddAdminForm(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="text-sm">Tambah Admin</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : (tenant ? 'Update' : 'Tambah')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
