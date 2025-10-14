import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Settings, Mail, Shield, Globe, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { platformSettingsSchema, type PlatformSettingsData } from '@/lib/form-schemas';

export function SettingsTab() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<PlatformSettingsData>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      platform_name: 'Simple POS Platform',
      platform_description: 'Multi-tenant Point of Sale platform',
      platform_url: 'https://simplepos.com',
      support_email: 'support@simplepos.com',
      admin_email: 'admin@simplepos.com',
      maintenance_mode: false,
      registration_enabled: true,
      email_verification_required: true,
      max_tenants_per_user: 1,
      default_tenant_settings: {
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
        language: 'id',
        theme: 'light'
      },
      email_settings: {
        provider: 'smtp',
        smtp_host: '',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        from_name: 'Simple POS',
        from_email: 'noreply@simplepos.com'
      },
      security_settings: {
        session_timeout: 24,
        max_login_attempts: 5,
        password_min_length: 8,
        require_2fa: false,
        allowed_domains: []
      },
      notification_settings: {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        admin_notifications: true
      }
    }
  });

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 SettingsTab: Loading platform settings...');
      
      // Try to load from platform_settings table (gracefully handle missing table)
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') { 
        // PGRST116 = no rows returned, PGRST205 = table doesn't exist
        console.error('❌ SettingsTab: Error loading settings:', error);
        setError(`Failed to load settings: ${error.message}`);
        return;
      }

      if (data) {
        console.log('✅ SettingsTab: Settings loaded successfully');
        reset(data.settings || {});
      } else {
        console.log('ℹ️ SettingsTab: No existing settings found or table missing, using defaults');
      }
    } catch (err) {
      console.error('❌ SettingsTab: Unexpected error loading settings:', err);
      setError('An unexpected error occurred while loading settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const onSubmit = async (data: PlatformSettingsData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      console.log('🔄 SettingsTab: Saving platform settings:', data);

      // Try to save to platform_settings table (gracefully handle missing table)
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          id: 'platform',
          settings: data,
          updated_at: new Date().toISOString()
        });

      if (error && error.code !== 'PGRST205') { // PGRST205 = table doesn't exist
        console.error('❌ SettingsTab: Error saving settings:', error);
        setError(`Failed to save settings: ${error.message}`);
        return;
      }

      if (error && error.code === 'PGRST205') {
        console.log('ℹ️ SettingsTab: platform_settings table does not exist, settings not persisted');
        setSuccess('Settings validated successfully (table not available for persistence)');
        setTimeout(() => setSuccess(null), 3000);
        return;
      }

      console.log('✅ SettingsTab: Settings saved successfully');
      setSuccess('Platform settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ SettingsTab: Unexpected error saving settings:', err);
      setError('An unexpected error occurred while saving settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <span className="ml-3 text-slate-600">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platform Settings</h2>
          <p className="text-slate-600 mt-1">
            Configure global platform settings and preferences
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Platform Information
                </CardTitle>
                <CardDescription>
                  Basic platform details and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform_name">Platform Name *</Label>
                    <Input
                      id="platform_name"
                      {...register('platform_name')}
                      placeholder="Simple POS Platform"
                      className={errors.platform_name ? 'border-red-500' : ''}
                    />
                    {errors.platform_name && (
                      <p className="text-sm text-red-600">{errors.platform_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform_url">Platform URL</Label>
                    <Input
                      id="platform_url"
                      {...register('platform_url')}
                      placeholder="https://simplepos.com"
                      className={errors.platform_url ? 'border-red-500' : ''}
                    />
                    {errors.platform_url && (
                      <p className="text-sm text-red-600">{errors.platform_url.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform_description">Platform Description</Label>
                  <Textarea
                    id="platform_description"
                    {...register('platform_description')}
                    placeholder="Multi-tenant Point of Sale platform"
                    rows={3}
                    className={errors.platform_description ? 'border-red-500' : ''}
                  />
                  {errors.platform_description && (
                    <p className="text-sm text-red-600">{errors.platform_description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      {...register('support_email')}
                      placeholder="support@simplepos.com"
                      className={errors.support_email ? 'border-red-500' : ''}
                    />
                    {errors.support_email && (
                      <p className="text-sm text-red-600">{errors.support_email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Admin Email</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      {...register('admin_email')}
                      placeholder="admin@simplepos.com"
                      className={errors.admin_email ? 'border-red-500' : ''}
                    />
                    {errors.admin_email && (
                      <p className="text-sm text-red-600">{errors.admin_email.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Platform Configuration
                </CardTitle>
                <CardDescription>
                  General platform behavior and limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                    <p className="text-sm text-slate-500">
                      Enable maintenance mode to temporarily disable the platform
                    </p>
                  </div>
                  <Switch
                    id="maintenance_mode"
                    checked={watch('maintenance_mode')}
                    onCheckedChange={(checked) => setValue('maintenance_mode', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="registration_enabled">Allow Registration</Label>
                    <p className="text-sm text-slate-500">
                      Allow new users to register on the platform
                    </p>
                  </div>
                  <Switch
                    id="registration_enabled"
                    checked={watch('registration_enabled')}
                    onCheckedChange={(checked) => setValue('registration_enabled', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_verification_required">Email Verification Required</Label>
                    <p className="text-sm text-slate-500">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <Switch
                    id="email_verification_required"
                    checked={watch('email_verification_required')}
                    onCheckedChange={(checked) => setValue('email_verification_required', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="max_tenants_per_user">Max Tenants Per User</Label>
                  <Input
                    id="max_tenants_per_user"
                    type="number"
                    min="1"
                    {...register('max_tenants_per_user', { valueAsNumber: true })}
                    className={errors.max_tenants_per_user ? 'border-red-500' : ''}
                  />
                  {errors.max_tenants_per_user && (
                    <p className="text-sm text-red-600">{errors.max_tenants_per_user.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure email provider and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email_provider">Email Provider</Label>
                  <Select 
                    value={watch('email_settings.provider')} 
                    onValueChange={(value) => setValue('email_settings.provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select email provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">AWS SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      {...register('email_settings.smtp_host')}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      {...register('email_settings.smtp_port', { valueAsNumber: true })}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_username">SMTP Username</Label>
                    <Input
                      id="smtp_username"
                      {...register('email_settings.smtp_username')}
                      placeholder="your-email@gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp_password">SMTP Password</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      {...register('email_settings.smtp_password')}
                      placeholder="Your app password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from_name">From Name</Label>
                    <Input
                      id="from_name"
                      {...register('email_settings.from_name')}
                      placeholder="Simple POS"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from_email">From Email</Label>
                    <Input
                      id="from_email"
                      type="email"
                      {...register('email_settings.from_email')}
                      placeholder="noreply@simplepos.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Configuration
                </CardTitle>
                <CardDescription>
                  Configure security policies and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (hours)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min="1"
                    max="168"
                    {...register('security_settings.session_timeout', { valueAsNumber: true })}
                    className={errors.security_settings?.session_timeout ? 'border-red-500' : ''}
                  />
                  {errors.security_settings?.session_timeout && (
                    <p className="text-sm text-red-600">{errors.security_settings.session_timeout.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    min="3"
                    max="10"
                    {...register('security_settings.max_login_attempts', { valueAsNumber: true })}
                    className={errors.security_settings?.max_login_attempts ? 'border-red-500' : ''}
                  />
                  {errors.security_settings?.max_login_attempts && (
                    <p className="text-sm text-red-600">{errors.security_settings.max_login_attempts.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Minimum Password Length</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    min="6"
                    max="32"
                    {...register('security_settings.password_min_length', { valueAsNumber: true })}
                    className={errors.security_settings?.password_min_length ? 'border-red-500' : ''}
                  />
                  {errors.security_settings?.password_min_length && (
                    <p className="text-sm text-red-600">{errors.security_settings.password_min_length.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="require_2fa">Require 2FA</Label>
                    <p className="text-sm text-slate-500">
                      Require two-factor authentication for all users
                    </p>
                  </div>
                  <Switch
                    id="require_2fa"
                    checked={watch('security_settings.require_2fa')}
                    onCheckedChange={(checked) => setValue('security_settings.require_2fa', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure notification channels and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <p className="text-sm text-slate-500">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={watch('notification_settings.email_notifications')}
                    onCheckedChange={(checked) => setValue('notification_settings.email_notifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms_notifications">SMS Notifications</Label>
                    <p className="text-sm text-slate-500">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    id="sms_notifications"
                    checked={watch('notification_settings.sms_notifications')}
                    onCheckedChange={(checked) => setValue('notification_settings.sms_notifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push_notifications">Push Notifications</Label>
                    <p className="text-sm text-slate-500">
                      Send push notifications to mobile devices
                    </p>
                  </div>
                  <Switch
                    id="push_notifications"
                    checked={watch('notification_settings.push_notifications')}
                    onCheckedChange={(checked) => setValue('notification_settings.push_notifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="admin_notifications">Admin Notifications</Label>
                    <p className="text-sm text-slate-500">
                      Send notifications to platform administrators
                    </p>
                  </div>
                  <Switch
                    id="admin_notifications"
                    checked={watch('notification_settings.admin_notifications')}
                    onCheckedChange={(checked) => setValue('notification_settings.admin_notifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
