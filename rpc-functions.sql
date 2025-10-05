-- =============================================
-- AUTHENTICATION RPC FUNCTIONS
-- =============================================

-- Function to get user access status (platform + tenant access)
CREATE OR REPLACE FUNCTION get_user_access_status()
RETURNS JSONB AS $$
DECLARE
    user_email TEXT;
    result JSONB;
BEGIN
    -- Get current user's email
    user_email := auth.jwt() ->> 'email';

    IF user_email IS NULL THEN
        RETURN NULL;
    END IF;

    -- Build response
    result := jsonb_build_object(
        'is_super_admin', EXISTS(
            SELECT 1 FROM admin_users
            WHERE email = user_email AND role = 'super_admin' AND is_active = true
        ),
        'user_id', auth.uid(),
        'user_email', user_email,
        'memberships', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'tenant_id', tu.tenant_id,
                        'tenant_slug', t.slug,
                        'tenant_name', t.name,
                        'role', tu.role
                    )
                )
                FROM tenant_users tu
                JOIN tenants t ON t.id = tu.tenant_id
                WHERE tu.user_email = user_email AND tu.is_active = true
            ),
            '[]'::jsonb
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_access_status() TO authenticated;
