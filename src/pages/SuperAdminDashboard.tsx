import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Shield, List, Grid3X3, Table, UserPlus, X, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ModernDialog } from '@/components/ui/modern-dialog';
import { AdvancedTable } from '@/components/ui/advanced-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppToast } from '@/components/ui/toast-provider';
import { TenantFormModal } from '@/components/admin/TenantFormModalNew';
import { ColumnDef } from '@tanstack/react-table';
type Tenant = {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_id?: string;
  settings?: any;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

type TenantAdmin = {
  id: string;
  tenant_id: string;
  user_id?: string;
  user_email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;
  permissions?: any[];
  tenant_role?: string;
  updated_at?: string;
};

interface SuperAdminDashboardProps {
  onBack: () => void;
}

export function SuperAdminDashboard({ onBack }: SuperAdminDashboardProps) {
  const { signOut, user, isSuperAdmin, loading } = useAuth();
  // const { showSuccess, showError, showInfo } = useAppToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantAdmins, setTenantAdmins] = useState<{[tenantId: string]: TenantAdmin[]}>({});
  const [componentLoading, setComponentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    details?: any;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Table columns definition
  const tenantColumns: ColumnDef<Tenant>[] = [
    {
      accessorKey: "name",
      header: "Nama Tenant",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("slug")}</Badge>
      ),
    },
    {
      accessorKey: "owner_email",
      header: "Owner Email",
      cell: ({ row }) => {
        const email = row.getValue("owner_email") as string;
        return (
          <div className="text-sm text-muted-foreground">
            {email || 'admin@' + row.original.slug + '.com'}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Dibuat",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <div className="text-sm">{date.toLocaleDateString('id-ID')}</div>;
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <StatusBadge status={isActive ? "active" : "inactive"}>
            {isActive ? "Aktif" : "Nonaktif"}
          </StatusBadge>
        );
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditTenant(tenant)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResendEmail(tenant)}
            >
              <Mail className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteTenant(tenant)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 SuperAdminDashboard:', {
        loading,
        user: user?.email,
        isSuperAdmin,
        adminRole: isSuperAdmin ? 'super_admin' : null
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

    if (!isSuperAdmin) {
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
  }, [user, isSuperAdmin, loading]);

  const loadTenants = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 SuperAdminDashboard: Starting to load tenants...');
      }
      setComponentLoading(true);
      setError(null);

      // Load tenants with retry mechanism
      let tenantsData, tenantsError;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
          );
          
          const queryPromise = (supabase as any)
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
          
          const result = await Promise.race([queryPromise, timeoutPromise]);
          
          tenantsData = result.data;
          tenantsError = result.error;
          
          if (!tenantsError) break;
          
          retryCount++;
          if (retryCount < maxRetries) {
            console.warn(`⚠️ Retry ${retryCount}/${maxRetries} for tenants query`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        } catch (err) {
          tenantsError = err;
          retryCount++;
          if (retryCount < maxRetries) {
            console.warn(`⚠️ Retry ${retryCount}/${maxRetries} for tenants query (catch)`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      if (tenantsError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ SuperAdminDashboard: Tenants query error after retries:', tenantsError);
        }
        
        // Check if it's a connection error
        if (tenantsError.message?.includes('ERR_CONNECTION_CLOSED') || 
            tenantsError.message?.includes('Failed to fetch') ||
            tenantsError.message?.includes('timeout')) {
          console.warn('🔄 Connection issue detected, using fallback data');
          tenantsData = []; // Use empty array as fallback
        } else {
        throw tenantsError;
        }
      }

      const tenants = tenantsData || [];
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ SuperAdminDashboard: Loaded tenants:', tenants.length);
      }
      setTenants(tenants);

      // Load tenant owners for each tenant
      const adminsMap: {[tenantId: string]: TenantAdmin[]} = {};

      for (const tenant of tenants) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 SuperAdminDashboard: Loading owner for tenant:', tenant.name);
        }
        
        if (tenant.owner_id) {
          // Get real user email using RPC function
          try {
            const { data: userEmail, error: emailError } = await supabase
              .rpc('get_user_email_by_id', { user_id: tenant.owner_id });

            if (!emailError && userEmail) {
              // Create a TenantAdmin object with real email
            const ownerAdmin: TenantAdmin = {
                id: tenant.owner_id,
                user_id: tenant.owner_id,
                user_email: userEmail, // Real email from auth.users
              tenant_id: tenant.id,
              role: 'admin',
              is_active: true,
                created_at: new Date().toISOString(),
              invited_by: null,
                invited_at: new Date().toISOString(),
                joined_at: new Date().toISOString(),
              permissions: [],
              tenant_role: 'admin',
                updated_at: new Date().toISOString()
            };
            adminsMap[tenant.id] = [ownerAdmin];
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ SuperAdminDashboard: Loaded owner for tenant:', tenant.name, ownerAdmin.user_email);
              }
            } else {
              // Fallback: use owner_email from tenant table
              if (tenant.owner_email) {
                const ownerAdmin: TenantAdmin = {
                  id: tenant.owner_id,
                  user_id: tenant.owner_id,
                  user_email: tenant.owner_email,
                  tenant_id: tenant.id,
                  role: 'admin',
                  is_active: true,
                  created_at: new Date().toISOString(),
                  invited_by: null,
                  invited_at: new Date().toISOString(),
                  joined_at: new Date().toISOString(),
                  permissions: [],
                  tenant_role: 'admin',
                  updated_at: new Date().toISOString()
                };
                adminsMap[tenant.id] = [ownerAdmin];
                if (process.env.NODE_ENV === 'development') {
                  console.log('✅ SuperAdminDashboard: Using fallback email for tenant:', tenant.name, tenant.owner_email);
            }
          } else {
            adminsMap[tenant.id] = [];
            if (process.env.NODE_ENV === 'development') {
                  console.log('⚠️ SuperAdminDashboard: No email found for tenant owner:', tenant.name);
                }
              }
            }
          } catch (error) {
            console.error('Error loading tenant owner email:', error);
            // Fallback: use owner_email from tenant table
            if (tenant.owner_email) {
              const ownerAdmin: TenantAdmin = {
                id: tenant.owner_id,
                user_id: tenant.owner_id,
                user_email: tenant.owner_email,
                tenant_id: tenant.id,
                role: 'admin',
                is_active: true,
                created_at: new Date().toISOString(),
                invited_by: null,
                invited_at: new Date().toISOString(),
                joined_at: new Date().toISOString(),
                permissions: [],
                tenant_role: 'admin',
                updated_at: new Date().toISOString()
              };
              adminsMap[tenant.id] = [ownerAdmin];
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ SuperAdminDashboard: Using fallback email after error for tenant:', tenant.name, tenant.owner_email);
              }
            } else {
              adminsMap[tenant.id] = [];
            }
          }
        } else {
          adminsMap[tenant.id] = [];
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ SuperAdminDashboard: No owner set for tenant:', tenant.name);
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

      setDialogState({
        isOpen: true,
        type: 'success',
        title: 'Tenant Berhasil Dihapus',
        message: 'Tenant telah berhasil dihapus dari sistem.'
      });
      loadTenants();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting tenant:', error);
      }
      setDialogState({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menghapus Tenant',
        message: 'Terjadi error saat menghapus tenant. Silakan coba lagi.',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  const handleResendEmail = async (tenant: Tenant) => {
    if (!tenant.owner_email) {
      setDialogState({
        isOpen: true,
        type: 'error',
        title: 'Owner Email Tidak Ditemukan',
        message: 'Tenant tidak memiliki owner email yang valid.',
        details: {
          ownerEmail: tenant.owner_email
        }
      });
      return;
    }

    // Generate setup URL
    const setupUrl = `${window.location.origin}/${tenant.slug}/admin/setup?token=${tenant.id}`;
    
    // Show setup URL (no email sending)
    setDialogState({
      isOpen: true,
      type: 'info',
      title: 'Setup URL untuk Tenant',
      message: `Silakan kirim setup URL ini ke ${tenant.owner_email} untuk setup password.`,
      details: {
        ownerEmail: tenant.owner_email,
        setupUrl: setupUrl
      }
    });
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
                          <p className="text-sm text-slate-500">Owner: {tenantAdmins[tenant.id]?.[0]?.user_email || tenant.owner_email || 'admin@' + tenant.slug + '.com'}</p>
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
                          onClick={() => handleResendEmail(tenant)}
                          className="flex items-center justify-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                          title="Get Setup URL"
                        >
                          <Mail className="w-4 h-4" />
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
                                <span>Owner: {tenantAdmins[tenant.id]?.[0]?.user_email || tenant.owner_email || 'admin@' + tenant.slug + '.com'}</span>
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
                            onClick={() => handleResendEmail(tenant)}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            title="Get Setup URL"
                          >
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">Setup URL</span>
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
                <AdvancedTable
                  columns={tenantColumns}
                  data={tenants}
                  searchKey="name"
                  searchPlaceholder="Cari tenant..."
                  showSearch={true}
                  showColumnToggle={true}
                  showExport={false}
                  pageSize={10}
                />
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
          onSuccess={(data) => {
            setDialogState({
              isOpen: true,
              type: data.type || 'success',
              title: data.title,
              message: data.message,
              details: data.details
            });
          }}
          onError={(error) => {
            setDialogState({
              isOpen: true,
              type: 'error',
              title: error.title,
              message: error.message,
              details: error.details
            });
          }}
        />
      )}

      {/* Modern Dialog */}
      <ModernDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        details={dialogState.details}
        showCopyButton={true}
        showExternalLink={true}
      />
    </div>
  );
}
  tenant,
  onClose,
  onSuccess,
  onError
}: {
  tenant: Tenant | null;
  onClose: () => void;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    slug: tenant?.slug || '',
    owner_email: tenant?.owner_email || '',
    owner_password: '', // Password untuk user account
    is_active: tenant?.is_active ?? true,
  });

  // Email invitation system state
  const [createMethod, setCreateMethod] = useState<'auto' | 'invite'>('auto');

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
      // In the new system, each tenant has only one owner
      if (tenant.owner_id) {
        // SECURITY FIX: Use proper Supabase Auth API instead of direct auth.users access
        const { data: userRoleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .eq('user_id', tenant.owner_id)
          .single();

        if (!roleError && userRoleData) {
          // Create a mock TenantAdmin object for compatibility
          const ownerAdmin: TenantAdmin = {
            id: tenant.owner_id,
            user_id: tenant.owner_id,
            user_email: `user-${tenant.owner_id.slice(0, 8)}@tenant.com`, // Placeholder email
            tenant_id: tenant.id,
            role: 'admin',
            is_active: true,
            created_at: new Date().toISOString(),
            invited_by: null,
            invited_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            permissions: [],
            tenant_role: 'admin',
            updated_at: new Date().toISOString()
          };
          setTenantAdmins([ownerAdmin]);
        } else {
          setTenantAdmins([]);
        }
      } else {
        setTenantAdmins([]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading tenant owner:', error);
      }
      setTenantAdmins([]);
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
        // Create user role
        const { error: roleError } = await (supabase as any)
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'tenant',
            created_at: new Date().toISOString()
          });

        if (roleError) throw roleError;

        // Set user as tenant owner
        const { error: tenantError } = await (supabase as any)
          .from('tenants')
          .update({ owner_id: authData.user.id })
          .eq('id', tenant.id);

        if (tenantError) throw tenantError;

        setNewAdminEmail('');
        setNewAdminPassword('');
        setShowAddAdminForm(false);
        loadTenantAdmins();
        onSuccess({
          title: 'Admin Berhasil Ditambahkan',
          message: 'Admin baru telah berhasil ditambahkan dengan akun baru.',
          details: {
            email: newAdminEmail,
            password: newAdminPassword
          },
          type: 'success'
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding admin:', error);
      }
      onError({
        title: 'Gagal Menambahkan Admin',
        message: 'Terjadi error saat menambahkan admin baru.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus admin ini?')) return;

    try {
      // Remove user role
      const { error: roleError } = await (supabase as any)
        .from('user_roles')
        .delete()
        .eq('user_id', adminId)
        .eq('role', 'tenant');

      if (roleError) throw roleError;

      // Remove tenant owner
      const { error: tenantError } = await (supabase as any)
        .from('tenants')
        .update({ owner_id: null })
        .eq('owner_id', adminId);

      if (tenantError) throw tenantError;

      loadTenantAdmins();
      onSuccess({
        title: 'Admin Berhasil Dihapus',
        message: 'Admin telah berhasil dihapus dari tenant.',
        type: 'success'
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error removing admin:', error);
      }
      onError({
        title: 'Gagal Menghapus Admin',
        message: 'Terjadi error saat menghapus admin.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
        onSuccess({
          title: 'Tenant Berhasil Diperbarui',
          message: 'Data tenant telah berhasil diperbarui.',
          type: 'success'
        });
      } else {
        // Create new tenant
        if (createMethod === 'auto') {
          // Auto Create Account Method
          if (!formData.owner_password) {
            onError({
              title: 'Password Owner Diperlukan',
              message: 'Password owner harus diisi untuk auto create account.',
              details: 'Silakan isi password untuk membuat akun otomatis.'
            });
            return;
          }

          // Step 1: Create user account in Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.owner_email,
            password: formData.owner_password,
          });

          if (authError) {
            console.error('Auth error:', authError);
            onError({
              title: 'Gagal Membuat User Account',
              message: 'Terjadi error saat membuat user account.',
              details: authError.message
            });
            return;
          }

          if (!authData.user) {
            onError({
              title: 'Gagal Membuat User Account',
              message: 'User account tidak berhasil dibuat.',
              details: 'Silakan coba lagi atau gunakan metode email invitation.'
            });
            return;
          }

          // Step 2: Create user role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: 'tenant',
              created_at: new Date().toISOString()
            });

          if (roleError) {
            console.error('Role error:', roleError);
            onError({
              title: 'Gagal Membuat User Role',
              message: 'Terjadi error saat membuat user role.',
              details: roleError.message
            });
            return;
          }

          // Step 3: Create tenant with owner_id
          const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
            .insert({
              name: formData.name,
              slug: formData.slug,
              owner_email: formData.owner_email,
              owner_id: authData.user.id,
              is_active: formData.is_active,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (tenantError) {
            console.error('Tenant error:', tenantError);
            onError({
              title: 'Gagal Membuat Tenant',
              message: 'Terjadi error saat membuat tenant.',
              details: tenantError.message
            });
            return;
          }

          onSuccess({
            title: 'Tenant Berhasil Ditambahkan!',
            message: 'Tenant baru telah berhasil dibuat dengan akun otomatis.',
            details: {
              email: formData.owner_email,
              password: formData.owner_password,
              url: `/${formData.slug}/admin/login`
            },
            type: 'success'
          });

        } else {
          // Manual Setup URL Method
          // Step 1: Create tenant without owner_id first
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert({
              name: formData.name,
              slug: formData.slug,
              owner_email: formData.owner_email,
              owner_id: null, // Will be set after user accepts invitation
              is_active: formData.is_active,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (tenantError) {
            console.error('Tenant error:', tenantError);
            onError({
              title: 'Gagal Membuat Tenant',
              message: 'Terjadi error saat membuat tenant.',
              details: tenantError.message
            });
            return;
          }

          // Step 2: Generate setup URL
          const setupUrl = `${window.location.origin}/${formData.slug}/admin/setup?token=${tenantData.id}`;
          
          // Show success with setup URL (no email sending)
          onSuccess({
            title: 'Tenant Berhasil Ditambahkan!',
            message: 'Tenant baru telah berhasil dibuat. Silakan kirim setup URL ke owner email untuk setup password.',
            details: {
              ownerEmail: formData.owner_email,
              setupUrl: setupUrl
            },
            type: 'info'
          });
        }
      }

      onClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving tenant:', error);
      }
      onError({
        title: 'Gagal Menyimpan Tenant',
        message: 'Terjadi error saat menyimpan tenant.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
                Owner Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.owner_email}
                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="owner@tenant.com"
              />
              <p className="text-xs text-slate-500 mt-1">Email pemilik tenant</p>
            </div>

            {!tenant && (
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Metode Pembuatan User Account
              </label>
                <div className="space-y-3">
                  <div className="flex items-center">
              <input
                      type="radio"
                      id="auto-create"
                      name="createMethod"
                      value="auto"
                      checked={createMethod === 'auto'}
                      onChange={(e) => setCreateMethod(e.target.value as 'auto')}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <label htmlFor="auto-create" className="ml-2 text-sm text-slate-700">
                      <span className="font-medium">Auto Create Account</span>
                      <p className="text-xs text-slate-500">Buat user account langsung dengan password</p>
                    </label>
            </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="email-invite"
                      name="createMethod"
                      value="invite"
                      checked={createMethod === 'invite'}
                      onChange={(e) => setCreateMethod(e.target.value as 'invite')}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <label htmlFor="email-invite" className="ml-2 text-sm text-slate-700">
                      <span className="font-medium">Manual Setup URL</span>
                      <p className="text-xs text-slate-500">Dapatkan setup URL untuk dikirim ke owner</p>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {!tenant && createMethod === 'auto' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                  Owner Password <span className="text-red-500">*</span>
              </label>
              <input
                  type="password"
                  required={createMethod === 'auto'}
                  value={formData.owner_password}
                  onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Password untuk login"
              />
                <p className="text-xs text-slate-500 mt-1">Password untuk login sebagai owner tenant</p>
            </div>
            )}

            {!tenant && createMethod === 'invite' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Manual Setup URL</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Setelah tenant dibuat, Anda akan mendapat setup URL yang bisa dikirim ke:</p>
                      <p className="font-medium">{formData.owner_email || 'owner@tenant.com'}</p>
                      <p className="mt-1">Owner tenant akan menggunakan URL tersebut untuk membuat password dan login ke sistem.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
