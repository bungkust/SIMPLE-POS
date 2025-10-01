import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

console.log('Supabase Config:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  keyLength: supabaseAnonKey?.length || 0,
  fullUrl: supabaseUrl,
});

if (!supabaseUrl || !supabaseAnonKey) {
  const error = new Error(
    `Missing Supabase environment variables:\n` +
    `VITE_SUPABASE_URL: ${supabaseUrl || 'NOT SET'}\n` +
    `VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'NOT SET'}`
  );
  console.error(error);
  throw error;
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

console.log('Supabase client created successfully');