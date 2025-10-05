import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function setupKopiPendekarAdmin() {
  const adminEmail = 'kusbot114@kopen.com';

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Please set up your .env file first!');
    console.log('💡 Make sure .env contains:');
    console.log('   VITE_SUPABASE_URL=https://fheaayyooebdsppcymce.supabase.co');
    console.log('   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔑 Setting up Kopi Pendekar admin...');
  console.log(`📧 Admin email: ${adminEmail}`);

  try {
    // First, get the user from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error getting users:', authError.message);
      console.log('💡 Make sure your Supabase service role key has admin permissions');
      return;
    }

    const targetUser = authUsers.users.find(user => user.email === adminEmail);

    if (!targetUser) {
      console.error(`❌ User ${adminEmail} not found in Supabase Auth`);
      console.log('💡 Please create the user first in Supabase Dashboard > Authentication > Users');
      return;
    }

    console.log(`✅ Found user: ${targetUser.email} (ID: ${targetUser.id})`);

    // 1. Add as Platform Admin (super_admin)
    console.log('👑 Adding as Platform Super Admin...');
    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        user_id: targetUser.id,
        email: targetUser.email,
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (adminError) {
      console.error('❌ Error adding platform admin:', adminError.message);
      return;
    }

    console.log('✅ Added as Platform Super Admin');

    // 2. Get Kopi Pendekar tenant ID
    console.log('🏪 Getting Kopi Pendekar tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('slug', 'kopipendekar')
      .single();

    if (tenantError || !tenant) {
      console.error('❌ Kopi Pendekar tenant not found');
      console.log('💡 Please run the database schema first to create the Kopi Pendekar tenant');
      return;
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.slug})`);

    // 3. Add as Tenant Admin for Kopi Pendekar
    console.log('👨‍💼 Adding as Kopi Pendekar Tenant Admin...');
    const { error: tenantAdminError } = await supabase
      .from('tenant_users')
      .upsert({
        tenant_id: tenant.id,
        user_id: targetUser.id,
        user_email: targetUser.email,
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (tenantAdminError) {
      console.error('❌ Error adding tenant admin:', tenantAdminError.message);
      return;
    }

    console.log('✅ Added as Kopi Pendekar Tenant Admin');

    console.log('');
    console.log('🎉 SUCCESS! Admin setup complete!');
    console.log(`🔑 Email: ${adminEmail}`);
    console.log('👑 Platform Role: Super Admin');
    console.log('🏪 Tenant Role: Kopi Pendekar Admin');
    console.log('');
    console.log('🚀 You can now login at:');
    console.log(`   http://localhost:5173/kopipendekar/admin/login`);
    console.log(`   http://localhost:5173/sadmin/dashboard`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupKopiPendekarAdmin();
