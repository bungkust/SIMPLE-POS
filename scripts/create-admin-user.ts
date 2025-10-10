import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser(userId: string, email: string) {
  console.log(`🔧 Creating admin user for ${email} (${userId})...`);
  
  try {
    // Create super admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        email: email,
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (adminError) {
      console.error('❌ Admin user creation error:', adminError);
      return false;
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
      return false;
    } else {
      console.log('✅ Found tenant:', tenant);
      
      // Create tenant admin user
      const { data: tenantUser, error: tenantUserError } = await supabase
        .from('tenant_users')
        .insert({
          user_id: userId,
          user_email: email,
          tenant_id: tenant.id,
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (tenantUserError) {
        console.error('❌ Tenant user creation error:', tenantUserError);
        return false;
      } else {
        console.log('✅ Tenant admin user created:', tenantUser);
      }
    }
    
    console.log('🎉 Admin user setup completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Email: ${email}`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Super Admin: ✅`);
    console.log(`   - Tenant Admin (kopipendekar): ✅`);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: npx tsx scripts/create-admin-user.ts <user_id> <email>');
  console.log('');
  console.log('To get the user_id:');
  console.log('1. Login with your email in the browser');
  console.log('2. Open browser console');
  console.log('3. Run: supabase.auth.getUser().then(u => console.log(u.data.user.id))');
  console.log('4. Copy the user_id and run this script');
  console.log('');
  console.log('Example:');
  console.log('npx tsx scripts/create-admin-user.ts 12345678-1234-1234-1234-123456789012 kusbot114@gmail.com');
  process.exit(1);
}

const [userId, email] = args;
createAdminUser(userId, email).then(success => {
  process.exit(success ? 0 : 1);
});
