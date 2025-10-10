-- Fix RLS policies for user_roles table
-- The current policies are too restrictive and causing 406 errors

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow service role to insert roles" ON public.user_roles;

-- Create more permissive policies for user_roles
-- Allow authenticated users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to view all roles (for debugging)
-- This is more permissive than the original policy
CREATE POLICY "Authenticated users can view all roles"
ON public.user_roles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow service role to do everything
CREATE POLICY "Service role can do everything"
ON public.user_roles
FOR ALL
USING (auth.role() = 'service_role');

-- Allow authenticated users to insert their own roles (for new user registration)
CREATE POLICY "Users can insert their own roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert any roles
CREATE POLICY "Service role can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Allow service role to update roles
CREATE POLICY "Service role can update roles"
ON public.user_roles
FOR UPDATE
USING (auth.role() = 'service_role');

-- Allow service role to delete roles
CREATE POLICY "Service role can delete roles"
ON public.user_roles
FOR DELETE
USING (auth.role() = 'service_role');

-- Also fix tenants policies to be more permissive
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can view their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can delete tenants" ON public.tenants;

-- Create more permissive policies for tenants
CREATE POLICY "Authenticated users can view all tenants"
ON public.tenants
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own tenant"
ON public.tenants
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Service role can do everything on tenants"
ON public.tenants
FOR ALL
USING (auth.role() = 'service_role');

-- Test the policies by checking if the current user can access user_roles
SELECT 
    'Current user can access user_roles' as test,
    COUNT(*) as role_count
FROM public.user_roles
WHERE user_id = auth.uid();