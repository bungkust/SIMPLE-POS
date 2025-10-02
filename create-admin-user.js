import { createTestAdminUser } from './src/lib/adminAuth.js';

console.log('🔑 Creating admin user in Supabase...');

async function setupAdmin() {
  const email = 'kusbot114@gmail.com';
  const password = '123456';

  console.log(`📧 Creating admin user: ${email}`);

  const success = await createTestAdminUser(email, password);

  if (success) {
    console.log('✅ Admin user ready!');
    console.log(`🔑 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('');
    console.log('🎯 Now you can login to admin dashboard with these credentials');
  } else {
    console.log('❌ Failed to create admin user');
    console.log('💡 Try logging in directly - the user might already exist');
  }
}

setupAdmin();
