-- =============================================
-- CLEAN UP AND FIX RLS POLICIES
-- =============================================

-- 1. DROP ALL EXISTING PROBLEMATIC POLICIES
DROP POLICY IF EXISTS "Admin users can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admin admin users access" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

DROP POLICY IF EXISTS "Super admin tenant users access" ON tenant_users;
DROP POLICY IF EXISTS "Super admins can manage tenant users" ON tenant_users;
DROP POLICY IF EXISTS "Tenant admins can manage their tenant users" ON tenant_users;
DROP POLICY IF EXISTS "Users can only access their tenant memberships" ON tenant_users;
DROP POLICY IF EXISTS "Users can view their tenant user records" ON tenant_users;

DROP POLICY IF EXISTS "Super admin can access all tenants" ON tenants;
DROP POLICY IF EXISTS "Super admin full access" ON tenants;
DROP POLICY IF EXISTS "Super admin tenants access" ON tenants;
DROP POLICY IF EXISTS "Super admins can manage tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;

-- 2. CREATE CORRECT NON-CIRCULAR POLICIES

-- For admin_users table (only super admins can manage)
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

-- For tenant_users table
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

CREATE POLICY "Users can view their own records"
ON tenant_users FOR SELECT
TO authenticated
USING (user_email = auth.jwt() ->> 'email');

-- For tenants table
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

-- 3. VERIFY THE CLEANUP WORKED
SELECT 'Checking remaining policies...' as status;
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('tenants', 'admin_users', 'tenant_users')
ORDER BY tablename, policyname;

-- 4. TEST THE FIXES
SELECT 'Testing tenants query...' as test;
SELECT id, name FROM tenants LIMIT 3;

SELECT 'Testing admin_users query...' as test;
SELECT email, role FROM admin_users WHERE email = 'tukangmalahu@gmail.com';

SELECT '✅ RLS Policy cleanup completed!' as result;
