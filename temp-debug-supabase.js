// Temporary debugging script for SuperAdminDashboard
// Add this to the SuperAdminDashboard component temporarily

// Add this inside the SuperAdminDashboard component
useEffect(() => {
  console.log('🔍 [TEMP DEBUG] SuperAdminDashboard state:', {
    loading,
    user: user?.email,
    isSuperAdmin,
    adminRole,
    timestamp: new Date().toISOString()
  });

  // Also test direct supabase query
  if (user?.email && !loading) {
    setTimeout(async () => {
      try {
        const { data, error } = await (window as any).supabase
          .from('admin_users')
          .select('role, is_active')
          .eq('email', user.email)
          .maybeSingle();
        
        console.log('🔍 [TEMP DEBUG] Direct query result:', { data, error });
      } catch (err) {
        console.error('🔍 [TEMP DEBUG] Direct query error:', err);
      }
    }, 1000);
  }
}, [loading, user, isSuperAdmin, adminRole]);
