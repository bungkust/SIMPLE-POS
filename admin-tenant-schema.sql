-- =============================================
-- ADMIN AND TENANT MANAGEMENT SCHEMA
-- =============================================

-- Create admin_users table (for super admin users)
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text CHECK (role IN ('super_admin', 'admin')) DEFAULT 'admin',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  subdomain text NOT NULL UNIQUE,
  domain text,
  email_domain text,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tenant_users table (for tenant-user relationships)
CREATE TABLE IF NOT EXISTS tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  role text CHECK (role IN ('admin', 'manager', 'cashier')) DEFAULT 'admin',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_email)
);

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users table
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

-- RLS Policies for tenants table
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

-- RLS Policies for tenant_users table
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
    AND tu.role IN ('admin', 'manager')
    AND tu.is_active = true
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(user_email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_active ON tenant_users(is_active);
