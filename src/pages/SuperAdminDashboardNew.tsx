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
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditTenant(tenant)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResendEmail(tenant)}
              className="h-8 w-8 p-0"
            >
              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteTenant(tenant)}
              className="text-destructive hover:text-destructive h-8 w-8 p-0"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
      });
    }

    if (!loading && isSuperAdmin) {
      loadTenants();
    }
  }, [loading, isSuperAdmin, user]);

  const loadTenants = async () => {
    setComponentLoading(true);
    try {
      // Retry mechanism with timeout
      let retryCount = 0;
      const maxRetries = 3;
      let tenantsData: Tenant[] = [];

      while (retryCount < maxRetries) {
        try {
          const { data, error } = await Promise.race([
            supabase.from('tenants').select('*'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
            )
          ]) as any;

          if (error) throw error;
          tenantsData = data || [];
          break;
        } catch (error) {
          retryCount++;
          console.warn(`Attempt ${retryCount} failed:`, error);
          if (retryCount >= maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      setTenants(tenantsData);

      // Load tenant admins
      const adminsMap: {[tenantId: string]: TenantAdmin[]} = {};
      
      for (const tenant of tenantsData) {
        if (tenant.owner_id) {
          try {
            const { data: emailData, error: emailError } = await supabase
              .rpc('get_user_email_by_id', { user_id: tenant.owner_id });

            if (emailError) {
              console.error('Error getting user email:', emailError);
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
            } else if (emailData?.email) {
              const ownerAdmin: TenantAdmin = {
                id: tenant.owner_id,
                user_id: tenant.owner_id,
                user_email: emailData.email,
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
                console.log('✅ SuperAdminDashboard: Using RPC email for tenant:', tenant.name, emailData.email);
              }
            } else {
              adminsMap[tenant.id] = [];
              if (process.env.NODE_ENV === 'development') {
                console.log('⚠️ SuperAdminDashboard: No email found for tenant owner:', tenant.name);
              }
            }
          } catch (error) {
            console.error('Error loading tenant owner email:', error);
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
      const { error } = await supabase
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
      console.error('Error signing out:', error);
    }
  };

  if (loading || componentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access this page.
              </p>
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground h-8 px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
              <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Manage tenants and system settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="h-8 px-2 sm:px-3">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Tenants</CardTitle>
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{tenants.length}</div>
              <p className="text-xs text-muted-foreground">
                {tenants.filter(t => t.is_active).length} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Tenants</CardTitle>
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{tenants.filter(t => t.is_active).length}</div>
              <p className="text-xs text-muted-foreground">
                {tenants.filter(t => !t.is_active).length} inactive
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Recent Activity</CardTitle>
              <Table className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {tenants.filter(t => {
                  const createdDate = new Date(t.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return createdDate > weekAgo;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                New this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Tenant Management</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Manage all tenants in the system
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="flex items-center space-x-1">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 w-8 p-0"
                  >
                    <Table className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <Button onClick={handleAddTenant} className="h-8 px-3 text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Tenant</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {tenants.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Tenants Found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first tenant.
                </p>
                <Button onClick={handleAddTenant}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Tenant
                </Button>
              </div>
            ) : (
              <div>
                {viewMode === 'table' ? (
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
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map((tenant) => (
                      <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-5 w-5 text-primary" />
                              <CardTitle className="text-lg">{tenant.name}</CardTitle>
                            </div>
                            <StatusBadge status={tenant.is_active ? "active" : "inactive"}>
                              {tenant.is_active ? "Aktif" : "Nonaktif"}
                            </StatusBadge>
                          </div>
                          <CardDescription>
                            <Badge variant="outline">{tenant.slug}</Badge>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>Owner: {tenantAdmins[tenant.id]?.[0]?.user_email || tenant.owner_email || 'admin@' + tenant.slug + '.com'}</p>
                            <p>Created: {new Date(tenant.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTenant(tenant)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendEmail(tenant)}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTenant(tenant)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tenants.map((tenant) => (
                      <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-primary" />
                                <div>
                                  <h3 className="font-semibold">{tenant.name}</h3>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>Slug: {tenant.slug}</span>
                                    <span>Owner: {tenantAdmins[tenant.id]?.[0]?.user_email || tenant.owner_email || 'admin@' + tenant.slug + '.com'}</span>
                                    <StatusBadge status={tenant.is_active ? "active" : "inactive"}>
                                      {tenant.is_active ? "Aktif" : "Nonaktif"}
                                    </StatusBadge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTenant(tenant)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendEmail(tenant)}
                              >
                                <Mail className="w-4 h-4 mr-1" />
                                Setup URL
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTenant(tenant)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
    </div>
  );
}
