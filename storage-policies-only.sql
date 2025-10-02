#!/bin/bash

echo "🗄️  SQL Queries for Supabase Storage RLS Policies"
echo "================================================"
echo ""

echo "📋 Copy and run these SQL commands in your Supabase SQL Editor:"
echo ""

cat << 'EOF'
-- =============================================
-- SUPABASE STORAGE RLS POLICIES SETUP
-- =============================================

-- 1. Enable RLS on storage objects table (Required first)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STORE-ICONS BUCKET POLICIES
-- =============================================

-- Policy for authenticated users to upload store icons
CREATE POLICY "Authenticated users can upload store icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-icons');

-- Policy for public read access to store icons
CREATE POLICY "Public read access for store icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'store-icons');

-- Optional: Policy for authenticated users to delete store icons
CREATE POLICY "Authenticated users can delete store icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'store-icons');

-- =============================================
-- MENU-PHOTOS BUCKET POLICIES
-- =============================================

-- Policy for authenticated users to upload menu photos
CREATE POLICY "Authenticated users can upload menu photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-photos');

-- Policy for public read access to menu photos
CREATE POLICY "Public read access for menu photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-photos');

-- Optional: Policy for authenticated users to delete menu photos
CREATE POLICY "Authenticated users can delete menu photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'menu-photos');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if buckets exist
SELECT id, name, public FROM storage.buckets WHERE id IN ('store-icons', 'menu-photos');

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- Test query (replace with actual file path to test)
-- SELECT * FROM storage.objects WHERE bucket_id = 'menu-photos' LIMIT 1;
EOF

echo ""
echo "🎯 How to Use:"
echo ""
echo "1. Copy all the SQL above (from ALTER TABLE... to the end)"
echo "2. Go to Supabase Dashboard → SQL Editor"
echo "3. Paste and run the commands"
echo "4. If you get permission errors, use Dashboard UI instead"
echo ""
echo "✅ After running these commands:"
echo "   • Both buckets will have proper RLS policies"
echo "   • Authenticated users can upload files"
echo "   • Public users can view/download files"
echo "   • Your photo upload features will work!"
echo ""

echo "🔧 Alternative: Use Dashboard UI"
echo "================================"
echo ""
echo "If SQL commands fail, use the Dashboard UI:"
echo ""
echo "For each bucket (store-icons and menu-photos):"
echo "1. Click the bucket → Policies tab → New Policy"
echo "2. Create INSERT policy for 'authenticated' users"
echo "3. Create SELECT policy for 'public' users"
echo ""
echo "🎉 Setup complete! Your storage is ready for uploads!"
