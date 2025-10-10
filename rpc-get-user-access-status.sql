-- RPC function to get user access status using service role
-- This function runs with elevated privileges to bypass RLS

CREATE OR REPLACE FUNCTION get_user_access_status_v2(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  admin_count INTEGER;
  tenant_memberships JSON;
  result JSON;
BEGIN
  -- Check if user is super admin
  SELECT COUNT(*) INTO admin_count
  FROM admin_users
  WHERE user_id = user_uuid AND is_active = true;
  
  -- Get tenant memberships
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'tenant_id', tu.tenant_id,
        'tenant_slug', t.slug,
        'tenant_name', t.name,
        'role', tu.role
      )
    ),
    '[]'::json
  ) INTO tenant_memberships
  FROM tenant_users tu
  JOIN tenants t ON tu.tenant_id = t.id
  WHERE tu.user_id = user_uuid AND tu.is_active = true;
  
  -- Build result
  result := json_build_object(
    'is_super_admin', admin_count > 0,
    'memberships', tenant_memberships,
    'user_id', user_uuid
  );
  
  RETURN result;
END;
$$;

