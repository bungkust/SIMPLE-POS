import { supabase } from '../lib/supabase';

/**
 * SECURITY FIX: Proper admin authentication with password verification
 * This function is now deprecated and should not be used for authentication
 * All authentication must go through Supabase Auth with proper password verification
 */
export async function simpleAdminLogin(email: string): Promise<boolean> {
  console.warn('⚠️ SECURITY WARNING: simpleAdminLogin is deprecated and insecure. Use Supabase Auth instead.');
  throw new Error('Insecure authentication method disabled. Use proper Supabase Auth with password verification.');
}

/**
 * Create a test user in Supabase Auth for admin access
 * This is a workaround since the current system expects Supabase Auth
 */
export async function createTestAdminUser(email: string, password: string = 'admin123') {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (error) {
      console.log('User creation note:', error.message);
      return false;
    }

    console.log('✅ Admin user created or already exists:', data.user?.email);
    return true;
  } catch (err) {
    console.error('Error creating admin user:', err);
    return false;
  }
}
