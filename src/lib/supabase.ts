import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

import { logger } from '@/lib/logger';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Get the correct redirect URL based on environment
export const getRedirectUrl = (path: string = '/sadmin/dashboard'): string => {
  const isProduction = import.meta.env.PROD;
  const siteUrl = import.meta.env.VITE_SITE_URL;

  if (isProduction) {
    return `${siteUrl}${path}`;
  }

  // Development: use current origin
  return `${window.location.origin}${path}`;
};

if (process.env.NODE_ENV === 'development') {
  logger.log('Supabase client initialized successfully');
}

if (!supabaseUrl || !supabaseAnonKey) {
  const error = new Error(
    `Missing Supabase environment variables:\n` +
    `VITE_SUPABASE_URL: ${supabaseUrl || 'NOT SET'}\n` +
    `VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'NOT SET'}`
  );
  logger.error(error);
  throw error;
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase-auth-token',
    flowType: 'pkce'  // Use PKCE flow for better security
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
      'apikey': supabaseAnonKey
    }
  }
});

// Make supabase globally available for debugging (development only)
if (import.meta.env.DEV) {
  (window as any).supabase = supabase;
}

if (process.env.NODE_ENV === 'development') {
  logger.log('Supabase client created successfully');
}