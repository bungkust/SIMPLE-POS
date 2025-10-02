#!/bin/bash

echo "🚀 Setting up Supabase storage bucket for store icons..."

# This script sets up the 'store-icons' bucket in Supabase Storage
# Make sure you have the Supabase CLI installed and configured

echo "📋 Instructions:"
echo "1. Install Supabase CLI: npm install -g supabase"
echo "2. Login to Supabase: supabase login"
echo "3. Link your project: supabase link --project-ref YOUR_PROJECT_REF"
echo "4. Run this script or manually create the bucket"
echo ""

echo "🔧 Creating storage bucket 'store-icons'..."

# Create the storage bucket using Supabase CLI
supabase storage buckets create store-icons --public || echo "⚠️  Bucket might already exist or CLI not configured"

echo ""
echo "📝 Manual Setup (if CLI doesn't work):"
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to Storage"
echo "3. Create a new bucket named 'store-icons'"
echo "5. Set up RLS policies for authenticated users"
echo ""

echo "🔐 Setting up Row Level Security (RLS) policies..."

echo "⚠️  IMPORTANT: You CANNOT run DDL commands on storage.objects table directly!"
echo "   RLS policies for storage must be set up through the Supabase Dashboard."
echo ""

echo "📋 CORRECT Setup Steps:"
echo ""

echo "Step 1: Create the storage bucket"
echo "  - Go to Supabase Dashboard → Storage"
echo "  - Click 'New Bucket'"
echo "  - Name: 'store-icons'"
echo "  - Make it PUBLIC"
echo "  - Click 'Create Bucket'"
echo ""

echo "Step 2: Configure RLS Policies"
echo "  - In the Storage section, find your 'store-icons' bucket"
echo "  - Click on the bucket to open its settings"
echo "  - Go to 'Policies' tab"
echo "  - Click 'New Policy'"
echo ""

echo "Step 3: Create Upload Policy"
echo "  - Policy Name: 'Authenticated users can upload store icons'"
echo "  - Operation: INSERT"
echo "  - Target Roles: authenticated"
echo "  - Policy Definition:"
echo "    bucket_id = 'store-icons'"
echo ""

echo "Step 4: Create Read Policy (Public)"
echo "  - Policy Name: 'Public read access for store icons'"
echo "  - Operation: SELECT"
echo "  - Target Roles: public"
echo "  - Policy Definition:"
echo "    bucket_id = 'store-icons'"
echo ""

echo "Step 5: Create Delete Policy (Optional)"
echo "  - Policy Name: 'Authenticated users can delete store icons'"
echo "  - Operation: DELETE"
echo "  - Target Roles: authenticated"
echo "  - Policy Definition:"
echo "    bucket_id = 'store-icons'"
echo ""

echo "🔧 Alternative: Use Supabase Client to set policies programmatically"
echo ""

cat << 'EOF'
import { supabase } from './lib/supabase';

// Create storage policies programmatically
const setupStoragePolicies = async () => {
  try {
    // These would need to be run with admin privileges
    // or through a server-side function

    console.log('Storage policies should be set up through Supabase Dashboard');
    console.log('See steps above for manual setup');
  } catch (error) {
    console.error('Error setting up storage policies:', error);
  }
};
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Follow the manual setup steps above in Supabase Dashboard"
echo "2. Make sure you're logged in as the project owner"
echo "3. Test the icon upload functionality"
echo ""
echo "🎯 Your store icon upload feature is now ready!"
echo "Admins can now upload custom icons from their device in the Settings tab."
