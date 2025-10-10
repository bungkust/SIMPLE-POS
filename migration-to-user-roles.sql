-- =========================================================
-- MIGRATION TO USER_ROLES AUTHENTICATION SYSTEM
-- =========================================================
-- This script migrates from admin_users + tenant_users to user_roles
-- Following the Test Login reference implementation

-- =============== STEP 1: CREATE NEW SCHEMA ==============

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'tenant');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =============== STEP 2: MODIFY TENANTS TABLE ==============

-- Add owner_id column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint on owner_id (one owner per tenant)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='tenants'
      AND constraint_name='tenants_owner_id_unique'
  ) THEN
    ALTER TABLE public.tenants 
    ADD CONSTRAINT tenants_owner_id_unique UNIQUE (owner_id);
  END IF;
END$$;

-- =============== STEP 3: MIGRATE DATA ==============

-- Migrate admin_users to user_roles (super_admin role)
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
    au.user_id,
    'super_admin'::app_role,
    au.created_at
FROM public.admin_users au
WHERE au.user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- For each tenant, pick the first admin as owner and migrate to user_roles
-- This is a simplified migration - in production you might want to manually review
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT DISTINCT
    tu.user_id,
    'tenant'::app_role,
    tu.created_at
FROM public.tenant_users tu
WHERE tu.user_id IS NOT NULL
  AND tu.role IN ('super_admin', 'admin')  -- Only migrate primary admins
ON CONFLICT (user_id, role) DO NOTHING;

-- Set tenant owners (pick first admin for each tenant)
UPDATE public.tenants 
SET owner_id = subquery.user_id
FROM (
    SELECT DISTINCT ON (tu.tenant_id) 
        tu.tenant_id,
        tu.user_id
    FROM public.tenant_users tu
    WHERE tu.user_id IS NOT NULL
      AND tu.role IN ('super_admin', 'admin')
    ORDER BY tu.tenant_id, tu.created_at ASC
) AS subquery
WHERE tenants.id = subquery.tenant_id
  AND tenants.owner_id IS NULL;

-- =============== STEP 4: CREATE RLS POLICIES ==============

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow service role to insert roles during signup
CREATE POLICY "Allow service role to insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (true);

-- Update tenants RLS policies
DROP POLICY IF EXISTS t_select ON public.tenants;
CREATE POLICY "Super admins can view all tenants"
ON public.tenants
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenants can view their own tenant"
ON public.tenants
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Super admins can insert tenants"
ON public.tenants
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update tenants"
ON public.tenants
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete tenants"
ON public.tenants
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- =============== STEP 5: UPDATE RPC FUNCTION ==============

-- Replace get_user_access_status function
CREATE OR REPLACE FUNCTION get_user_access_status()
RETURNS JSONB AS $$
DECLARE
    user_email TEXT;
    result JSONB;
    user_tenant JSONB;
BEGIN
    -- Get current user's email
    user_email := auth.jwt() ->> 'email';

    IF user_email IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get user's tenant if they are a tenant owner
    SELECT jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'slug', t.slug,
        'domain', t.domain
    ) INTO user_tenant
    FROM public.tenants t
    WHERE t.owner_id = auth.uid();

    -- Build response
    result := jsonb_build_object(
        'is_super_admin', public.has_role(auth.uid(), 'super_admin'),
        'tenant', user_tenant,
        'user_id', auth.uid(),
        'user_email', user_email
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_access_status() TO authenticated;

-- =============== STEP 6: CREATE TRIGGER FOR NEW USERS ==============

-- Create function to handle new user registration (assigns default 'tenant' role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'tenant');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign role on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============== STEP 7: CLEANUP (COMMENTED OUT FOR SAFETY) ==============

-- IMPORTANT: Uncomment these lines ONLY after verifying the migration worked correctly
-- and you have backed up your data!

-- Drop old tables
-- DROP TABLE IF EXISTS public.admin_users CASCADE;
-- DROP TABLE IF EXISTS public.tenant_users CASCADE;

-- Drop old RLS policies
-- DROP POLICY IF EXISTS "Platform admins can view all admin users" ON public.admin_users;
-- DROP POLICY IF EXISTS "Platform admins can insert admin users" ON public.admin_users;
-- DROP POLICY IF EXISTS "Platform admins can update admin users" ON public.admin_users;
-- DROP POLICY IF EXISTS "Platform admins can delete admin users" ON public.admin_users;

-- =============== VERIFICATION QUERIES ==============

-- Check migration results
SELECT 'user_roles count' as table_name, COUNT(*) as count FROM public.user_roles
UNION ALL
SELECT 'tenants with owners' as table_name, COUNT(*) as count FROM public.tenants WHERE owner_id IS NOT NULL
UNION ALL
SELECT 'super_admins' as table_name, COUNT(*) as count FROM public.user_roles WHERE role = 'super_admin'
UNION ALL
SELECT 'tenants' as table_name, COUNT(*) as count FROM public.user_roles WHERE role = 'tenant';

-- Show tenant ownership
SELECT 
    t.name as tenant_name,
    t.slug,
    u.email as owner_email,
    ur.role
FROM public.tenants t
LEFT JOIN auth.users u ON t.owner_id = u.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY t.name;
