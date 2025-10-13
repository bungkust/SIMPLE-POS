-- =========================================================
-- SECURE AUTHENTICATION RPC FUNCTIONS
-- =========================================================
-- These functions provide server-side authentication and authorization
-- that cannot be bypassed by client-side manipulation

-- =============== SECURE USER ACCESS STATUS ==============

-- Create or replace the secure user access status function
CREATE OR REPLACE FUNCTION public.get_user_access_status(user_id UUID DEFAULT auth.uid())
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    user_roles_data JSON;
    tenant_data JSON;
BEGIN
    -- Validate that the user_id matches the authenticated user
    -- This prevents users from checking other users' permissions
    IF user_id IS NULL OR user_id != auth.uid() THEN
        RETURN json_build_object(
            'error', 'Unauthorized access',
            'is_super_admin', false,
            'memberships', '[]'::json
        );
    END IF;

    -- Get user roles with proper security
    SELECT json_agg(role) INTO user_roles_data
    FROM public.user_roles
    WHERE user_roles.user_id = get_user_access_status.user_id;

    -- Check if user is super admin
    IF user_roles_data IS NOT NULL AND 'super_admin' = ANY(
        SELECT json_array_elements_text(user_roles_data)
    ) THEN
        -- Super admin - can access all tenants
        SELECT json_agg(
            json_build_object(
                'id', t.id,
                'name', t.name,
                'slug', t.slug,
                'owner_email', t.owner_email,
                'role', 'super_admin'
            )
        ) INTO tenant_data
        FROM public.tenants t;
        
        RETURN json_build_object(
            'is_super_admin', true,
            'memberships', COALESCE(tenant_data, '[]'::json),
            'user_roles', user_roles_data
        );
    END IF;

    -- Check if user is tenant owner
    SELECT json_agg(
        json_build_object(
            'id', t.id,
            'name', t.name,
            'slug', t.slug,
            'owner_email', t.owner_email,
            'role', 'tenant_owner'
        )
    ) INTO tenant_data
    FROM public.tenants t
    WHERE t.owner_id = get_user_access_status.user_id;

    -- Return tenant access if user owns any tenants
    IF tenant_data IS NOT NULL THEN
        RETURN json_build_object(
            'is_super_admin', false,
            'memberships', tenant_data,
            'user_roles', user_roles_data
        );
    END IF;

    -- No access
    RETURN json_build_object(
        'is_super_admin', false,
        'memberships', '[]'::json,
        'user_roles', user_roles_data
    );
END;
$$;

-- =============== SECURE PERMISSION CHECK ==============

-- Create function to check specific permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(
    permission_type TEXT,
    user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_roles_data JSON;
    tenant_count INTEGER;
BEGIN
    -- Validate that the user_id matches the authenticated user
    IF user_id IS NULL OR user_id != auth.uid() THEN
        RETURN false;
    END IF;

    -- Get user roles
    SELECT json_agg(role) INTO user_roles_data
    FROM public.user_roles
    WHERE user_roles.user_id = check_user_permission.user_id;

    -- Check permission based on type
    CASE permission_type
        WHEN 'super_admin' THEN
            RETURN user_roles_data IS NOT NULL AND 'super_admin' = ANY(
                SELECT json_array_elements_text(user_roles_data)
            );
        
        WHEN 'tenant_admin' THEN
            -- Check if user owns any tenants
            SELECT COUNT(*) INTO tenant_count
            FROM public.tenants
            WHERE owner_id = check_user_permission.user_id;
            
            RETURN tenant_count > 0;
        
        WHEN 'tenant_access' THEN
            -- Check if user has any role (super_admin or tenant)
            RETURN user_roles_data IS NOT NULL AND (
                'super_admin' = ANY(SELECT json_array_elements_text(user_roles_data)) OR
                'tenant' = ANY(SELECT json_array_elements_text(user_roles_data))
            );
        
        ELSE
            RETURN false;
    END CASE;
END;
$$;

-- =============== SECURE SESSION VALIDATION ==============

-- Create function to validate current session
CREATE OR REPLACE FUNCTION public.validate_user_session(user_id UUID DEFAULT auth.uid())
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    -- Validate that the user_id matches the authenticated user
    IF user_id IS NULL OR user_id != auth.uid() THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Invalid session'
        );
    END IF;

    -- Check if user exists and has valid roles
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = validate_user_session.user_id
    ) THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'No roles assigned'
        );
    END IF;

    -- Session is valid
    RETURN json_build_object(
        'valid', true,
        'user_id', user_id,
        'timestamp', now()
    );
END;
$$;

-- =============== GRANT PERMISSIONS ==============

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_access_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_permission(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_user_session(UUID) TO authenticated;

-- =============== SECURITY NOTES ==============

-- These functions are SECURITY DEFINER, meaning they run with the privileges
-- of the function owner (typically the database owner), not the caller.
-- This ensures that:
-- 1. Users cannot bypass RLS policies by calling these functions
-- 2. All permission checks are done server-side
-- 3. Client-side manipulation cannot affect the results
-- 4. The functions validate that users can only check their own permissions

-- =============== USAGE EXAMPLES ==============

-- Check user access status:
-- SELECT public.get_user_access_status();

-- Check specific permission:
-- SELECT public.check_user_permission('super_admin');
-- SELECT public.check_user_permission('tenant_admin');
-- SELECT public.check_user_permission('tenant_access');

-- Validate session:
-- SELECT public.validate_user_session();
