-- RPC function to update tenant owner_id after user setup
-- This function allows authenticated users to update owner_id for their tenant

CREATE OR REPLACE FUNCTION public.update_tenant_owner_id(
  tenant_id UUID,
  user_id UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    tenant_record RECORD;
BEGIN
    -- Validate inputs
    IF tenant_id IS NULL OR user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Missing required parameters'
        );
    END IF;

    -- Check if tenant exists and has matching owner_email
    SELECT t.*, au.email as user_email
    INTO tenant_record
    FROM public.tenants t
    JOIN auth.users au ON au.id = user_id
    WHERE t.id = tenant_id 
    AND t.owner_email = au.email
    AND t.owner_id IS NULL; -- Only allow if owner_id is not set yet

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Tenant not found or owner already set or email mismatch'
        );
    END IF;

    -- Update tenant with owner_id
    UPDATE public.tenants 
    SET 
        owner_id = user_id,
        updated_at = NOW()
    WHERE id = tenant_id;

    -- Check if update was successful
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Owner ID updated successfully',
            'tenant_id', tenant_id,
            'owner_id', user_id
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to update owner ID'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_tenant_owner_id(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.update_tenant_owner_id(UUID, UUID) IS 'Updates tenant owner_id after user completes setup. Only allows if owner_email matches user email and owner_id is not set yet.';
