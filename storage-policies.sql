#!/bin/bash

echo "🗃️  Supabase Storage RLS Policies Setup Script"
echo "=============================================="
echo ""

echo "📋 EXECUTION ORDER:"
echo "=================="
echo ""

echo "🔥 CRITICAL - Execute these FIRST:"
echo ""

cat << 'EOF'
-- 1. Create the storage bucket (REQUIRED)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-icons',
  'store-icons',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS (REQUIRED)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EOF

echo ""
echo "🔐 IMPORTANT - Execute these SECOND:"
echo ""

cat << 'EOF'
-- 3. Upload policy for authenticated users (REQUIRED)
CREATE POLICY "Authenticated users can upload store icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-icons');

-- 4. Read policy for public access (REQUIRED)
CREATE POLICY "Public read access for store icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'store-icons');
EOF

echo ""
echo "🔄 OPTIONAL - Execute these THIRD (if needed):"
echo ""

cat << 'EOF'
-- 5. Delete policy for authenticated users (OPTIONAL)
CREATE POLICY "Authenticated users can delete store icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'store-icons');

-- 6. View policy for authenticated users (OPTIONAL)
CREATE POLICY "Authenticated users can view store icons"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'store-icons');
EOF

echo ""
echo "🔧 TROUBLESHOOTING - Execute these if problems persist:"
echo ""

cat << 'EOF'
-- Alternative: More permissive policies (if above fails)
DROP POLICY IF EXISTS "Authenticated users can upload store icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view store icons" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for store icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete store icons" ON storage.objects;

CREATE POLICY "Allow authenticated users all operations"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'store-icons')
WITH CHECK (bucket_id = 'store-icons');
EOF

echo ""
echo "✅ VERIFICATION - Execute these to check setup:"
echo ""

cat << 'EOF'
-- Check if bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'store-icons';

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
EOF

echo ""
echo "🎯 EXECUTION SUMMARY:"
echo "==================="
echo ""
echo "📋 MINIMUM REQUIRED (Execute in order):"
echo "1. ✅ Create bucket (Step 1)"
echo "2. ✅ Enable RLS (Step 2)"
echo "3. ✅ Upload policy (Step 3)"
echo "4. ✅ Read policy (Step 4)"
echo ""
echo "🔧 OPTIONAL (if you want delete functionality):"
echo "5. ✅ Delete policy (Step 5)"
echo "6. ✅ View policy (Step 6)"
echo ""
echo "🚨 TROUBLESHOOTING (if errors occur):"
echo "7. ✅ Alternative policies (Troubleshooting section)"
echo ""
echo "🔍 VERIFICATION (to confirm setup):"
echo "8. ✅ Check bucket and policies (Verification section)"
echo ""
echo "💡 Start with steps 1-4. If upload still fails, try the troubleshooting section."
