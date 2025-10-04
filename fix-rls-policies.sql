-- =============================================
-- FIX RLS POLICY INFINITE RECURSION
-- =============================================

-- 1. Check current policies (for debugging)
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('tenants', 'admin_users', 'tenant_users');

-- 2. Drop problematic policies that might cause recursion
DROP POLICY IF EXISTS "tenant_policy" ON tenants;
DROP POLICY IF EXISTS "admin_users_policy" ON admin_users;
DROP POLICY IF EXISTS "tenant_users_policy" ON tenant_users;

-- 3. Create FIXED policies for tenants table
-- Allow super admins to manage all tenants
CREATE POLICY "Super admins can manage tenants"
ON tenants FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.email = auth.jwt() ->> 'email'
    AND au.role = 'super_admin'
    AND au.is_active = true
  )
);

-- Allow users to view tenants they belong to
CREATE POLICY "Users can view their tenants"
ON tenants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_users tu
    WHERE tu.tenant_id = tenants.id
    AND tu.user_email = auth.jwt() ->> 'email'
    AND tu.is_active = true
  )
);

-- 4. Create FIXED policies for admin_users table
-- Only super admins can manage admin users
CREATE POLICY "Super admins can manage admin users"
ON admin_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.email = auth.jwt() ->> 'email'
    AND au.role = 'super_admin'
    AND au.is_active = true
  )
);

-- Allow admin users to view other admin users (for debugging)
CREATE POLICY "Admin users can view admin users"
ON admin_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.email = auth.jwt() ->> 'email'
    AND au.is_active = true
  )
);

-- 5. Create FIXED policies for tenant_users table
-- Super admins can manage all tenant users
CREATE POLICY "Super admins can manage tenant users"
ON tenant_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.email = auth.jwt() ->> 'email'
    AND au.role = 'super_admin'
    AND au.is_active = true
  )
);

-- Tenant admins can manage users in their tenants
CREATE POLICY "Tenant admins can manage their tenant users"
ON tenant_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_users tu
    WHERE tu.tenant_id = tenant_users.tenant_id
    AND tu.user_email = auth.jwt() ->> 'email'
    AND tu.role IN ('super_admin', 'admin')
    AND tu.is_active = true
  )
);

-- Users can view their own tenant user records
CREATE POLICY "Users can view their tenant user records"
ON tenant_users FOR SELECT
TO authenticated
USING (
  user_email = auth.jwt() ->> 'email'
);

-- 6. Verify the fixes worked
SELECT 'Testing tenants query...' as test;
SELECT COUNT(*) FROM tenants;

SELECT 'Testing admin_users query...' as test;
SELECT COUNT(*) FROM admin_users WHERE email = 'tukangmalahu@gmail.com';

-- 7. Check final policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('tenants', 'admin_users', 'tenant_users')
ORDER BY tablename, policyname;
