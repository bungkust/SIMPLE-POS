// Script to create Supabase storage bucket for QRIS images
// Run this script once to set up the storage bucket

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to set this environment variable

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log('🔄 Setting up storage buckets...');

    // Create the qris-images bucket
    const { data: qrisData, error: qrisError } = await supabase.storage.createBucket('qris-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB limit
    });

    if (qrisError) {
      if (qrisError.message.includes('already exists')) {
        console.log('✅ Bucket "qris-images" already exists');
      } else {
        throw qrisError;
      }
    } else {
      console.log('✅ Successfully created bucket "qris-images"');
    }

    // Create the store-icons bucket for tenant logos
    const { data: storeData, error: storeError } = await supabase.storage.createBucket('store-icons', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB limit
    });

    if (storeError) {
      if (storeError.message.includes('already exists')) {
        console.log('✅ Bucket "store-icons" already exists');
      } else {
        throw storeError;
      }
    } else {
      console.log('✅ Successfully created bucket "store-icons"');
    }

    // Create the menu-images bucket for menu item images
    const { data: menuData, error: menuError } = await supabase.storage.createBucket('menu-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB limit
    });

    if (menuError) {
      if (menuError.message.includes('already exists')) {
        console.log('✅ Bucket "menu-images" already exists');
      } else {
        throw menuError;
      }
    } else {
      console.log('✅ Successfully created bucket "menu-images"');
    }

    // Create the store-assets bucket for general store assets
    const { data: assetsData, error: assetsError } = await supabase.storage.createBucket('store-assets', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB limit
    });

    if (assetsError) {
      if (assetsError.message.includes('already exists')) {
        console.log('✅ Bucket "store-assets" already exists');
      } else {
        throw assetsError;
      }
    } else {
      console.log('✅ Successfully created bucket "store-assets"');
    }

    console.log('📋 Bucket configurations:');
    console.log('- qris-images: Public, 5MB limit, for QRIS images');
    console.log('- store-icons: Public, 5MB limit, for tenant logos');
    console.log('- menu-images: Public, 5MB limit, for menu item images');
    console.log('- store-assets: Public, 5MB limit, for general store assets');

    // Set up RLS policies for both buckets
    console.log('🔒 Setting up Row Level Security policies...');

    const buckets = ['qris-images', 'store-icons', 'menu-images', 'store-assets'];
    
    for (const bucketName of buckets) {
      console.log(`🔒 Setting up policies for ${bucketName}...`);
      
      // Enable RLS on the bucket (required for policies)
      await supabase.rpc('enable_rls_on_storage_bucket', {
        bucket_name: bucketName
      });

      // Create policy to allow authenticated users to upload
      await supabase.rpc('create_storage_policy', {
        bucket_name: bucketName,
        policy_name: 'Allow authenticated uploads',
        policy_definition: `
          CREATE POLICY "Allow authenticated uploads" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = '${bucketName}' AND
            auth.role() = 'authenticated'
          );
        `
      });

      // Create policy to allow public read access
      await supabase.rpc('create_storage_policy', {
        bucket_name: bucketName,
        policy_name: 'Allow public read access',
        policy_definition: `
          CREATE POLICY "Allow public read access" ON storage.objects
          FOR SELECT USING (
            bucket_id = '${bucketName}'
          );
        `
      });
    }

    console.log('✅ RLS policies configured successfully for all buckets');

  } catch (error) {
    console.error('❌ Error setting up storage bucket:', error);

    if (error.message.includes('Row Level Security')) {
      console.log('💡 RLS Issue detected. Try these manual steps:');
      console.log('1. Go to Supabase Dashboard > Storage');
      console.log('2. For each bucket (qris-images, store-icons, menu-images, store-assets):');
      console.log('   - Click "Settings" tab');
      console.log('   - Set "Row Level Security" to "Disabled"');
      console.log('3. Or create policies manually in SQL Editor');
    }

    process.exit(1);
  }
}

setupStorage();
