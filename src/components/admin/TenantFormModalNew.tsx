import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormInput } from '@/components/forms/FormInput';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { FormRadioGroup } from '@/components/forms/FormRadioGroup';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, UserPlus, Mail, Settings, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { tenantFormSchema, type TenantFormData } from '@/lib/form-schemas';
import { generateSlug } from '@/lib/form-utils';

interface TenantFormModalProps {
  tenant: any | null;
  onClose: () => void;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
}

export function TenantFormModal({ tenant, onClose, onSuccess, onError }: TenantFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [createMethod, setCreateMethod] = useState<'auto' | 'invite'>('auto');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: tenant?.name || '',
      slug: tenant?.slug || '',
      owner_email: tenant?.owner_email || '',
      owner_password: '',
      is_active: tenant?.is_active ?? true,
    }
  });

  const name = watch('name');
  const ownerEmail = watch('owner_email');

  // Auto-generate slug when name changes
  useEffect(() => {
    if (name && !tenant) {
      const generatedSlug = generateSlug(name);
      setValue('slug', generatedSlug);
    }
  }, [name, setValue, tenant]);

  const onSubmit = async (data: TenantFormData) => {
    setLoading(true);
    try {
      if (tenant) {
        // Update existing tenant
        const { error } = await supabase
          .from('tenants')
          .update({
            name: data.name,
            slug: data.slug,
            owner_email: data.owner_email,
            is_active: data.is_active,
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
          if (!data.owner_password) {
            onError({
              title: 'Password Owner Diperlukan',
              message: 'Password owner harus diisi untuk auto create account.',
              details: 'Silakan isi password untuk membuat akun otomatis.'
            });
            return;
          }

          // Step 1: Create user account in Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.owner_email,
            password: data.owner_password,
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
              name: data.name,
              slug: data.slug,
              owner_email: data.owner_email,
              owner_id: authData.user.id,
              is_active: data.is_active,
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
              email: data.owner_email,
              password: data.owner_password,
              url: `/${data.slug}/admin/login`
            },
            type: 'success'
          });

        } else {
          // Manual Setup URL Method
          // Step 1: Create tenant without owner_id first
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert({
              name: data.name,
              slug: data.slug,
              owner_email: data.owner_email,
              owner_id: null, // Will be set after user accepts invitation
              is_active: data.is_active,
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
          const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
          const setupUrl = `${baseUrl}/${data.slug}/admin/setup?token=${tenantData.id}`;
          
          // Show success with setup URL (no email sending)
          onSuccess({
            title: 'Tenant Berhasil Ditambahkan!',
            message: 'Tenant baru telah berhasil dibuat. Silakan kirim setup URL ke owner email untuk setup password.',
            details: {
              ownerEmail: data.owner_email,
              setupUrl: setupUrl
            },
            type: 'info'
          });
        }
      }

      onClose();
    } catch (error: any) {
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {tenant ? 'Edit Tenant' : 'Tambah Tenant Baru'}
          </DialogTitle>
          <DialogDescription>
            {tenant 
              ? 'Perbarui informasi tenant yang sudah ada'
              : 'Buat tenant baru untuk sistem POS'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  {...register('name')}
                  label="Nama Tenant"
                  placeholder="Masukkan nama tenant"
                  error={errors.name?.message}
                  required
                  disabled={loading}
                />
                <FormInput
                  {...register('slug')}
                  label="Slug"
                  placeholder="tenant-slug"
                  error={errors.slug?.message}
                  required
                  disabled={loading}
                  helperText="URL-friendly identifier (auto-generated from name)"
                />
              </div>

              <FormInput
                {...register('owner_email')}
                label="Owner Email"
                type="email"
                placeholder="owner@example.com"
                error={errors.owner_email?.message}
                required
                disabled={loading}
                helperText="Email yang akan digunakan sebagai admin tenant"
              />

              <FormCheckbox
                {...register('is_active')}
                label="Tenant Aktif"
                disabled={loading}
              />
            </CardContent>
          </Card>

          {/* Creation Method (only for new tenants) */}
          {!tenant && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metode Pembuatan</CardTitle>
                <CardDescription>
                  Pilih cara pembuatan akun admin untuk tenant ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormRadioGroup
                  value={createMethod}
                  onValueChange={(value) => setCreateMethod(value as 'auto' | 'invite')}
                  options={[
                    {
                      value: 'auto',
                      label: 'Auto Create Account',
                      disabled: false
                    },
                    {
                      value: 'invite',
                      label: 'Manual Setup URL',
                      disabled: false
                    }
                  ]}
                />

                {createMethod === 'auto' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Akun admin akan dibuat otomatis dengan email dan password yang Anda berikan.
                    </AlertDescription>
                  </Alert>
                )}

                {createMethod === 'invite' && (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Setup URL akan diberikan untuk dikirim ke owner email. User akan menggunakan URL untuk setup password sendiri.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Password Field (only for auto create method) */}
          {!tenant && createMethod === 'auto' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Password Admin</CardTitle>
                <CardDescription>
                  Password untuk akun admin yang akan dibuat otomatis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormInput
                  {...register('owner_password')}
                  label="Password"
                  type="password"
                  placeholder="Masukkan password admin"
                  error={errors.owner_password?.message}
                  required
                  disabled={loading}
                  helperText="Minimal 6 karakter"
                />
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {tenant ? 'Menyimpan...' : 'Membuat...'}
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  {tenant ? 'Simpan Perubahan' : 'Buat Tenant'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
