// Script to create Supabase storage bucket for QRIS images
// Run this script once to set up the storage bucket

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to set this environment variable

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log('🔄 Setting up QRIS images storage bucket...');

    // Create the qris-images bucket
    const { data, error } = await supabase.storage.createBucket('qris-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB limit
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket "qris-images" already exists');
        return;
      }
      throw error;
    }

    console.log('✅ Successfully created bucket "qris-images"');
    console.log('📋 Bucket configuration:');
    console.log('- Public: true');
    console.log('- Allowed MIME types: jpeg, png, gif, webp');
    console.log('- File size limit: 5MB');

    // Set up RLS policies for the bucket
    console.log('🔒 Setting up Row Level Security policies...');

    // Enable RLS on the bucket (required for policies)
    await supabase.rpc('enable_rls_on_storage_bucket', {
      bucket_name: 'qris-images'
    });

    // Create policy to allow authenticated users to upload
    await supabase.rpc('create_storage_policy', {
      bucket_name: 'qris-images',
      policy_name: 'Allow authenticated uploads',
      policy_definition: `
        CREATE POLICY "Allow authenticated uploads" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'qris-images' AND
          auth.role() = 'authenticated'
        );
      `
    });

    // Create policy to allow public read access
    await supabase.rpc('create_storage_policy', {
      bucket_name: 'qris-images',
      policy_name: 'Allow public read access',
      policy_definition: `
        CREATE POLICY "Allow public read access" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'qris-images'
        );
      `
    });

    console.log('✅ RLS policies configured successfully');

  } catch (error) {
    console.error('❌ Error setting up storage bucket:', error);

    if (error.message.includes('Row Level Security')) {
      console.log('💡 RLS Issue detected. Try these manual steps:');
      console.log('1. Go to Supabase Dashboard > Storage > qris-images');
      console.log('2. Click "Settings" tab');
      console.log('3. Set "Row Level Security" to "Disabled"');
      console.log('4. Or create policies manually in SQL Editor');
    }

    process.exit(1);
  }
}

setupStorage();
