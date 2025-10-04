#!/bin/bash

echo "🧪 Testing RLS Policy Fix"
echo "=========================="
echo ""

echo "📋 Step 1: Test tenants table query..."
curl -s "https://fheaayyooebdsppcymce.supabase.co/rest/v1/tenants?select=id,name" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" || echo "❌ Failed to query tenants"

echo ""
echo "📋 Step 2: Test admin_users table query..."
curl -s "https://fheaayyooebdsppcymce.supabase.co/rest/v1/admin_users?select=id,email,role" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" || echo "❌ Failed to query admin_users"

echo ""
echo "✅ If both queries succeed without 'infinite recursion' errors, the fix worked!"
echo "🔄 If you still see errors, the RLS policies need more adjustment."
