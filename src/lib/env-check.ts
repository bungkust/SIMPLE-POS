/**
 * Environment Variable Verification Utility
 * 
 * This utility helps verify that required environment variables are properly configured
 * and provides debugging information for environment-related issues.
 */

export function verifyEnvironment() {
  const requiredVars = [
    'VITE_SITE_URL',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missing = requiredVars.filter(v => !import.meta.env[v]);
  
  if (missing.length > 0 && import.meta.env.PROD) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('This may cause invitation links and other features to malfunction.');
  }
  
  if (import.meta.env.DEV) {
    console.log('🔍 Environment check:', {
      VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD
    });
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    hasSiteUrl: !!import.meta.env.VITE_SITE_URL
  };
}

/**
 * Get the base URL for the application
 * Provides fallback logic and warnings for missing configuration
 */
export function getBaseUrl(): string {
  const siteUrl = import.meta.env.VITE_SITE_URL;
  
  if (!siteUrl) {
    console.warn('⚠️ VITE_SITE_URL not configured, using window.location.origin as fallback');
    if (import.meta.env.PROD) {
      console.error('❌ CRITICAL: VITE_SITE_URL missing in production!');
    }
    return window.location.origin;
  }
  
  return siteUrl;
}

/**
 * Validate that the current environment is properly configured
 * Returns true if all required variables are present
 */
export function isEnvironmentValid(): boolean {
  const result = verifyEnvironment();
  return result.isValid;
}
