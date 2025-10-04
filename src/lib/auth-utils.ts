// Utility function to clear corrupted auth state
export const clearAuthState = () => {
  console.log('🧹 Clearing corrupted auth state...');

  // Clear localStorage
  window.localStorage.removeItem('supabase-auth-token');
  window.localStorage.removeItem('supabase.auth.token');
  window.localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.replace('.supabase.co', '') + '-auth-token');

  // Clear sessionStorage
  window.sessionStorage.clear();

  // Clear any OAuth state
  const url = new URL(window.location.href);
  url.searchParams.delete('error');
  url.searchParams.delete('error_code');
  url.searchParams.delete('error_description');
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState({}, document.title, url.pathname);

  console.log('✅ Auth state cleared');
};

// Check for OAuth errors on page load
export const handleOAuthError = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const errorCode = urlParams.get('error_code');

  if (error === 'invalid_request' && errorCode === 'bad_oauth_state') {
    console.warn('🚨 OAuth state error detected, clearing auth state...');
    clearAuthState();

    // Show user-friendly message
    alert('Authentication session expired. Please sign in again.');

    return true; // Indicates error was handled
  }

  return false; // No error
};
