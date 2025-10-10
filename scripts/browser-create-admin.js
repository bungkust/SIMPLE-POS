// Browser script to create admin user
// Run this in browser console after logging in

async function createAdminUser(role = 'super_admin') {
  console.log(`🔧 Creating ${role} user...`);
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No user found. Please login first.');
      return;
    }
    
    console.log('✅ Current user:', user.email, user.id);
    
    // Create user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: role,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (roleError) {
      console.error('❌ User role creation error:', roleError);
    } else {
      console.log(`✅ ${role} role created:`, userRole);
    }
    
    // If creating a tenant user, also set them as tenant owner
    if (role === 'tenant') {
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
        
        // Set user as tenant owner
        const { data: updatedTenant, error: updateError } = await supabase
          .from('tenants')
          .update({ owner_id: user.id })
          .eq('id', tenant.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Tenant owner update error:', updateError);
        } else {
          console.log('✅ Tenant owner set:', updatedTenant);
        }
      }
    }
    
    console.log('🎉 User setup completed!');
    console.log('📋 Summary:');
    console.log(`   - Email: ${user.email}`);
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Role: ${role}`);
    if (role === 'tenant') {
      console.log(`   - Tenant Owner (kopipendekar): ✅`);
    }
    console.log('');
    console.log('🔄 Now refresh the page and try accessing admin dashboard again!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function - change role as needed
// createAdminUser('super_admin'); // For super admin
// createAdminUser('tenant');      // For tenant owner
createAdminUser('super_admin');

