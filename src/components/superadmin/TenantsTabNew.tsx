import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Eye, Shield, Building2, Mail, Calendar, AlertCircle, CheckCircle, XCircle, Link, Copy, ExternalLink, Check, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ColumnDef } from '@tanstack/react-table';
import { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedTable } from '@/components/ui/advanced-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TenantFormModal } from './TenantFormModalNew';
import { deleteTenantStorageStructure } from '@/lib/storage-utils';
import { logger } from '@/lib/logger';

type Tenant = Database['public']['Tables']['tenants']['Row'];

export function TenantsTab() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [selectedTenantForInvitation, setSelectedTenantForInvitation] = useState<Tenant | null>(null);
  const [copied, setCopied] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string>('');
  const { currentTenant } = useAuth();

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.database('Starting to load tenants', { component: 'TenantsTab' });
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading tenants', { error: error.message, component: 'TenantsTab' });
        setError(`Failed to load tenants: ${error.message}`);
        return;
      }

      logger.database('Tenants loaded successfully', { count: data?.length || 0, component: 'TenantsTab' });
      setTenants(data || []);
    } catch (err) {
      logger.error('Unexpected error loading tenants', { error: err.message, component: 'TenantsTab' });
      setError('An unexpected error occurred while loading tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleDelete = async (tenant: Tenant) => {
    try {
      setIsDeleting(true);
      
      // Delete tenant from database
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenant.id);

      if (error) {
        logger.error('Error deleting tenant', { error: error.message, component: 'TenantsTab' });
        setError(`Failed to delete tenant: ${error.message}`);
        return;
      }

      logger.database('Tenant deleted successfully', { component: 'TenantsTab' });
      
      // Clean up tenant storage structure
      try {
        await deleteTenantStorageStructure(tenant.slug);
        logger.log('✅ Storage structure cleaned up for deleted tenant:', tenant.slug);
      } catch (storageError) {
        logger.error('⚠️ Failed to clean up storage structure, but tenant was deleted:', storageError);
        // Don't fail the entire operation if storage cleanup fails
      }
      
      await loadTenants();
      setShowDeleteConfirm(false);
      setDeletingTenant(null);
    } catch (err) {
      logger.error('Unexpected error deleting tenant', { error: err.message, component: 'TenantsTab' });
      setError('An unexpected error occurred while deleting tenant');
    } finally {
      setIsDeleting(false);
      setDeletingTenant(null);
    }
  };

  const generateInvitationLink = (tenant: Tenant) => {
    const baseUrl = import.meta.env.VITE_SITE_URL;
    
    console.log('🔍 DEBUG - VITE_SITE_URL:', import.meta.env.VITE_SITE_URL);
    console.log('🔍 DEBUG - window.location.origin:', window.location.origin);
    
    if (!baseUrl) {
      logger.error('VITE_SITE_URL not configured, using window.location.origin', { component: 'TenantsTab' });
      // Show warning to user in production
      if (import.meta.env.PROD) {
        alert('WARNING: Site URL not configured. Please contact administrator.');
      }
    }
    
    const finalUrl = baseUrl || window.location.origin;
    console.log('🔍 DEBUG - baseUrl used:', finalUrl);
    return `${finalUrl}/${tenant.slug}/admin/setup?token=${tenant.id}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy to clipboard', { error: error.message, component: 'TenantsTab' });
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleViewInvitation = (tenant: Tenant) => {
    setSelectedTenantForInvitation(tenant);
    const link = generateInvitationLink(tenant);
    setInvitationLink(link);
    setShowInvitationDialog(true);
  };

  const regenerateInvitationLink = () => {
    if (!selectedTenantForInvitation) return;
    
    const newLink = generateInvitationLink(selectedTenantForInvitation);
    setInvitationLink(newLink);
    
    // Show success message
    logger.log('Invitation link regenerated', { component: 'TenantsTab' });
  };

  const getStatusBadge = (tenant: Tenant) => {
    // Simple status logic - you can enhance this based on your business rules
    return (
      <StatusBadge 
        status="active" 
        className="bg-green-100 text-green-800 border-green-200"
      >
        Active
      </StatusBadge>
    );
  };

  const columns: ColumnDef<Tenant>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Tenant Name',
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-slate-900">{tenant.name}</div>
              <div className="text-sm text-slate-500">/{tenant.slug}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'owner_email',
      header: 'Owner Email',
      cell: ({ row }) => {
        const email = row.getValue('owner_email') as string;
        return (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700">{email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const tenant = row.original;
        return getStatusBadge(tenant);
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700">
              {new Date(date).toLocaleDateString('id-ID')}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingTenant(tenant);
                setShowForm(true);
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Navigate to tenant's admin dashboard
                window.open(`/admin/dashboard?tenant=${tenant.slug}`, '_blank');
              }}
              className="h-8 w-8 p-0"
              title="View Dashboard"
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewInvitation(tenant)}
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
              title="View Invitation Link"
            >
              <Link className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeletingTenant(tenant);
                setShowDeleteConfirm(true);
              }}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
              title="Delete Tenant"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  if (loading) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <span className="ml-3 text-slate-600">Loading tenants...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tenant Management</h2>
          <p className="text-slate-600 mt-1">
            Manage all platform tenants and their settings
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Total Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{tenants.length}</div>
            <p className="text-xs text-slate-500">Registered tenants</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Active Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{tenants.length}</div>
            <p className="text-xs text-slate-500">Currently active</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              New This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tenants.filter(t => {
                const created = new Date(t.created_at);
                const now = new Date();
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-slate-500">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-lg font-semibold text-slate-900">All Tenants</CardTitle>
          <CardDescription>
            View and manage all platform tenants
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No tenants found</h3>
              <p className="text-slate-600 mb-4">
                Get started by adding your first tenant to the platform
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Tenant
              </Button>
            </div>
          ) : (
            <AdvancedTable
              columns={columns}
              data={tenants}
              filterColumn="name"
              placeholder="Search tenants..."
            />
          )}
        </CardContent>
      </Card>

      {/* Tenant Form Modal */}
      {showForm && (
        <TenantFormModal
          tenant={editingTenant}
          onClose={() => {
            setShowForm(false);
            setEditingTenant(null);
            loadTenants();
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingTenant(null);
            loadTenants();
          }}
          onError={(error) => {
            logger.error('Tenant form error', { error: error.message, component: 'TenantsTab' });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingTenant?.name}"? This action cannot be undone.
              All data associated with this tenant will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingTenant(null);
                setIsDeleting(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deletingTenant!)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Tenant'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invitation Link Dialog */}
      {showInvitationDialog && selectedTenantForInvitation && (
        <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-600" />
                Invitation Link - {selectedTenantForInvitation.name}
              </DialogTitle>
              <DialogDescription>
                Kirim link invitation ini ke owner untuk setup akun admin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Owner Email Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Owner Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedTenantForInvitation.owner_email}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kirim link invitation ini ke email owner untuk setup password dan akses admin dashboard.
                  </p>
                </CardContent>
              </Card>

              {/* Invitation Link */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invitation Link</CardTitle>
                  <CardDescription>
                    Link ini akan mengarahkan owner ke halaman setup password untuk tenant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <code className="flex-1 text-sm break-all">
                      {invitationLink}
                    </code>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(invitationLink)}
                      variant="outline"
                      className="flex-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => window.open(invitationLink, '_blank')}
                      variant="outline"
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Link
                    </Button>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button
                      onClick={regenerateInvitationLink}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Link
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cara Menggunakan</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Copy link invitation di atas</li>
                    <li>Kirim link tersebut ke email owner: <strong>{selectedTenantForInvitation.owner_email}</strong></li>
                    <li>Owner akan mengklik link dan diarahkan ke halaman setup password</li>
                    <li>Setelah setup selesai, owner bisa login ke admin dashboard</li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowInvitationDialog(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
