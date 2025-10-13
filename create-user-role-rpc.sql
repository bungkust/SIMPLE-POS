-- RPC function to create user role after account setup
-- This function allows authenticated users to create their own role

CREATE OR REPLACE FUNCTION public.create_user_role(
  user_id UUID DEFAULT auth.uid(),
  role_type TEXT DEFAULT 'tenant'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    existing_role RECORD;
BEGIN
    -- Validate inputs
    IF user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User ID is required'
        );
    END IF;

    -- Validate role type
    IF role_type NOT IN ('super_admin', 'tenant') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid role type. Must be super_admin or tenant'
        );
    END IF;

    -- Check if user already has a role
    SELECT * INTO existing_role
    FROM public.user_roles
    WHERE user_roles.user_id = create_user_role.user_id;

    IF FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User already has a role assigned'
        );
    END IF;

    -- Create user role
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (user_id, role_type::user_role_enum, NOW());

    -- Check if insert was successful
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'User role created successfully',
            'user_id', user_id,
            'role', role_type
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to create user role'
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
GRANT EXECUTE ON FUNCTION public.create_user_role(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_user_role(UUID, TEXT) IS 'Creates a user role for authenticated users. Allows users to create their own tenant role after account setup.';
