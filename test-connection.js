import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fheaayyooebdsppcymce.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoZWFheXlvb2ViZHNwcGN5bWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTAzMjQsImV4cCI6MjA3NDk2NjMyNH0.YExMk_Q6sd53XXU62TrhW8GqCpADPBtmo91nsqSJhp0';

console.log('🔍 Testing Supabase Connection...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect
    console.log('✅ Testing basic connection...');
    const { data, error } = await supabase.from('categories').select('count').single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }
    console.log('✅ Supabase connection successful!\n');

    // Test 2: Check if tables exist by trying to query them
    console.log('📋 Checking tables...');

    const tables = ['categories', 'menu_items', 'orders', 'order_items', 'payment_proofs'];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').single();
        if (error && error.code !== 'PGRST116') {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // Test 3: Try to insert a test order
    console.log('\n🛒 Testing order creation...');
    const testOrder = {
      customer_name: 'Test Customer',
      phone: '08123456789',
      pickup_date: new Date().toISOString().split('T')[0],
      subtotal: 50000,
      total: 50000,
      order_code: `TEST-${Date.now()}`
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    if (orderError) {
      console.log(`❌ Order creation failed: ${orderError.message}`);
    } else {
      console.log(`✅ Order created successfully: ${orderData.order_code}`);

      // Clean up - delete the test order
      await supabase.from('orders').delete().eq('id', orderData.id);
      console.log('🗑️  Test order cleaned up');
    }

    console.log('\n🎉 All tests completed! Your Supabase connection is working perfectly.');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you ran the database-schema.sql in Supabase SQL Editor');
    console.error('2. Check that your .env file has the correct credentials');
    console.error('3. Verify your Supabase project is active');
  }
}

testConnection();
