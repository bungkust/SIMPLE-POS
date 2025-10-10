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

async function createAdminUser(userId: string, email: string, role: 'super_admin' | 'tenant' = 'super_admin') {
  console.log(`🔧 Creating ${role} user for ${email} (${userId})...`);
  
  try {
    // Create user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (roleError) {
      console.error('❌ User role creation error:', roleError);
      return false;
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
        return false;
      } else {
        console.log('✅ Found tenant:', tenant);
        
        // Set user as tenant owner
        const { data: updatedTenant, error: updateError } = await supabase
          .from('tenants')
          .update({ owner_id: userId })
          .eq('id', tenant.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Tenant owner update error:', updateError);
          return false;
        } else {
          console.log('✅ Tenant owner set:', updatedTenant);
        }
      }
    }
    
    console.log('🎉 User setup completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Email: ${email}`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Role: ${role}`);
    if (role === 'tenant') {
      console.log(`   - Tenant Owner (kopipendekar): ✅`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: npx tsx scripts/create-admin-user.ts <user_id> <email> [role]');
  console.log('');
  console.log('Roles:');
  console.log('  super_admin - Platform super admin (default)');
  console.log('  tenant      - Tenant owner');
  console.log('');
  console.log('To get the user_id:');
  console.log('1. Login with your email in the browser');
  console.log('2. Open browser console');
  console.log('3. Run: supabase.auth.getUser().then(u => console.log(u.data.user.id))');
  console.log('4. Copy the user_id and run this script');
  console.log('');
  console.log('Examples:');
  console.log('npx tsx scripts/create-admin-user.ts 12345678-1234-1234-1234-123456789012 kusbot114@gmail.com super_admin');
  console.log('npx tsx scripts/create-admin-user.ts 12345678-1234-1234-1234-123456789012 tenant@example.com tenant');
  process.exit(1);
}

const [userId, email, role] = args;
const userRole = (role as 'super_admin' | 'tenant') || 'super_admin';
createAdminUser(userId, email, userRole).then(success => {
  process.exit(success ? 0 : 1);
});

