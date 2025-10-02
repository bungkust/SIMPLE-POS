import { supabase } from '../lib/supabase';

/**
 * Create a simple admin authentication system that doesn't require Supabase Auth
 * Just checks if the email is in the admin list
 */
export async function simpleAdminLogin(email: string): Promise<boolean> {
  const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(email);
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
