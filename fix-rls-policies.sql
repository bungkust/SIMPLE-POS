-- Fix RLS policies to allow access to admin_users and tenant_users tables
-- This will allow authenticated users to read their own admin status and tenant memberships

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "admin_users_simple" ON admin_users;
DROP POLICY IF EXISTS "tenant_users_fixed" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_self_view" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_super_admin_manage" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_tenant_admin_manage" ON tenant_users;
DROP POLICY IF EXISTS "Super admin tenant_users access" ON tenant_users;

-- Create new permissive policies for admin_users
CREATE POLICY "admin_users_authenticated_read" ON admin_users
    FOR SELECT
    TO authenticated
    USING (true);

-- Create new permissive policies for tenant_users  
CREATE POLICY "tenant_users_authenticated_read" ON tenant_users
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to read their own admin status
CREATE POLICY "admin_users_self_read" ON admin_users
    FOR SELECT
    TO authenticated
    USING (email = auth.jwt() ->> 'email');

-- Allow authenticated users to read their own tenant memberships
CREATE POLICY "tenant_users_self_read" ON tenant_users
    FOR SELECT
    TO authenticated
    USING (user_email = auth.jwt() ->> 'email');

-- Grant necessary permissions
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON tenant_users TO authenticated;
