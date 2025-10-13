import { supabase } from './supabase';

/**
 * SECURE AUTHENTICATION SYSTEM
 * All authentication and authorization checks are now server-side validated
 */

export interface AuthResult {
  success: boolean;
  user?: any;
  role?: 'super_admin' | 'tenant';
  tenant?: any;
  error?: string;
}

/**
 * Secure authentication with proper password verification
 * This function validates credentials server-side through Supabase Auth
 */
export async function secureAuthenticate(email: string, password: string): Promise<AuthResult> {
  try {
    // Step 1: Authenticate with Supabase (server-side validation)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Authentication failed'
      };
    }

    // Step 2: Server-side role validation
    const roleResult = await validateUserRole(authData.user.id);
    
    if (!roleResult.success) {
      // Sign out user if role validation fails
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'User role validation failed'
      };
    }

    return {
      success: true,
      user: authData.user,
      role: roleResult.role,
      tenant: roleResult.tenant
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication system error'
    };
  }
}

/**
 * Server-side role validation using RPC function
 * This ensures role checks cannot be bypassed client-side
 */
export async function validateUserRole(userId: string): Promise<AuthResult> {
  try {
    // Use RPC function for server-side role validation
    const { data, error } = await supabase.rpc('get_user_access_status', {
      user_id: userId
    });

    if (error) {
      console.error('Role validation error:', error);
      return {
        success: false,
        error: 'Role validation failed'
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No role data found'
      };
    }

    // Determine user role and tenant
    let role: 'super_admin' | 'tenant' | undefined;
    let tenant = null;

    if (data.is_super_admin) {
      role = 'super_admin';
    } else if (data.memberships && data.memberships.length > 0) {
      role = 'tenant';
      tenant = data.memberships[0]; // Get first tenant membership
    }

    if (!role) {
      return {
        success: false,
        error: 'No valid role assigned'
      };
    }

    return {
      success: true,
      role,
      tenant
    };

  } catch (error) {
    console.error('Role validation error:', error);
    return {
      success: false,
      error: 'Role validation system error'
    };
  }
}

/**
 * Secure session validation
 * Validates that the current session is still valid and user has proper permissions
 */
export async function validateSession(): Promise<AuthResult> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return {
        success: false,
        error: 'No valid session'
      };
    }

    // Validate user role for current session
    return await validateUserRole(session.user.id);

  } catch (error) {
    console.error('Session validation error:', error);
    return {
      success: false,
      error: 'Session validation failed'
    };
  }
}

/**
 * Secure logout with session cleanup
 */
export async function secureLogout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Check if user has specific permission (server-side validated)
 */
export async function hasPermission(permission: 'super_admin' | 'tenant_admin' | 'tenant_access'): Promise<boolean> {
  try {
    const authResult = await validateSession();
    
    if (!authResult.success) {
      return false;
    }

    switch (permission) {
      case 'super_admin':
        return authResult.role === 'super_admin';
      case 'tenant_admin':
        return authResult.role === 'tenant' && authResult.tenant;
      case 'tenant_access':
        return authResult.role === 'tenant' || authResult.role === 'super_admin';
      default:
        return false;
    }
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}
