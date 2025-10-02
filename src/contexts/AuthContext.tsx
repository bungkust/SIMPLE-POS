import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  adminRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Check admin status from database
        await checkAdminStatus(currentUser.email);
      } else {
        setAdminRole(null);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Check admin status when user signs in
        await checkAdminStatus(currentUser.email);
      } else {
        setAdminRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (email: string | undefined) => {
    if (!email) {
      setAdminRole(null);
      return;
    }

    try {
      // Simple check: only kusbot114@gmail.com is admin
      if (email.toLowerCase() === 'kusbot114@gmail.com') {
        setAdminRole('super_admin');
      } else {
        setAdminRole(null);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setAdminRole(null);
    }
  };

  const signIn = async (_email: string, _password: string) => {
    // Email login is no longer supported - use Google OAuth only
    throw new Error('Email login is disabled. Please use Google OAuth.');
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin-dashboard`
      }
    });

    if (error) {
      console.error('Google OAuth error:', error);
      throw new Error('Gagal login dengan Google');
    }
  };

  const signOut = async () => {
    try {
      // Clear admin role when signing out
      setAdminRole(null);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Admin check based on database, not environment variables
  const isAdmin = adminRole !== null;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signInWithGoogle,
      signOut,
      isAdmin,
      adminRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}