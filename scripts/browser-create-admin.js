// Browser script to create admin user
// Run this in browser console after logging in

async function createAdminUser() {
  console.log('🔧 Creating admin user...');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No user found. Please login first.');
      return;
    }
    
    console.log('✅ Current user:', user.email, user.id);
    
    // Create super admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: user.id,
        email: user.email,
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (adminError) {
      console.error('❌ Admin user creation error:', adminError);
    } else {
      console.log('✅ Super admin user created:', adminUser);
    }
    
    // Get kopipendekar tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('slug', 'kopipendekar')
      .single();
    
    if (tenantError) {
      console.error('❌ Tenant query error:', tenantError);
    } else {
      console.log('✅ Found tenant:', tenant);
      
      // Create tenant admin user
      const { data: tenantUser, error: tenantUserError } = await supabase
        .from('tenant_users')
        .insert({
          user_id: user.id,
          user_email: user.email,
          tenant_id: tenant.id,
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (tenantUserError) {
        console.error('❌ Tenant user creation error:', tenantUserError);
      } else {
        console.log('✅ Tenant admin user created:', tenantUser);
      }
    }
    
    console.log('🎉 Admin user setup completed!');
    console.log('📋 Summary:');
    console.log(`   - Email: ${user.email}`);
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Super Admin: ✅`);
    console.log(`   - Tenant Admin (kopipendekar): ✅`);
    console.log('');
    console.log('🔄 Now refresh the page and try accessing admin dashboard again!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
createAdminUser();
