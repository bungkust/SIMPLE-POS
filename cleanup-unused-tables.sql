-- =====================================================
-- CLEANUP UNUSED TABLES AND COLUMNS
-- =====================================================
-- This script removes unused tables and cleans up duplicate data
-- between tenants.settings JSONB and tenant_info table

-- =====================================================
-- 1. DROP UNUSED TABLES
-- =====================================================

-- Drop tenant_settings table (replaced by tenant_info)
DROP TABLE IF EXISTS public.tenant_settings CASCADE;

-- Drop backup tables (no longer needed)
DROP TABLE IF EXISTS public.tenants_backup CASCADE;
DROP TABLE IF EXISTS public.tenants_settings_backup CASCADE;

-- =====================================================
-- 2. MIGRATE REMAINING DATA FROM tenants.settings TO tenant_info
-- =====================================================

-- First, let's see what's currently in tenants.settings
-- (Run this to check before cleanup)
-- SELECT id, name, settings FROM public.tenants WHERE settings IS NOT NULL;

-- Migrate any remaining order settings to tenant_info
-- (Note: tenant_info doesn't have order settings columns yet, so we'll keep them in tenants.settings for now)

-- =====================================================
-- 3. CLEAN UP tenants.settings JSONB
-- =====================================================

-- Remove duplicate data that's now in tenant_info table
-- Keep only order-related settings in tenants.settings
UPDATE public.tenants 
SET settings = jsonb_build_object(
  -- Order settings (keep these)
  'auto_accept_orders', COALESCE((settings->>'auto_accept_orders')::boolean, false),
  'require_phone_verification', COALESCE((settings->>'require_phone_verification')::boolean, false),
  'allow_guest_checkout', COALESCE((settings->>'allow_guest_checkout')::boolean, true),
  'minimum_order_amount', COALESCE((settings->>'minimum_order_amount')::numeric, 0),
  'delivery_fee', COALESCE((settings->>'delivery_fee')::numeric, 0),
  'free_delivery_threshold', COALESCE((settings->>'free_delivery_threshold')::numeric, 0)
)
WHERE settings IS NOT NULL;

-- =====================================================
-- 4. VERIFY CLEANUP
-- =====================================================

-- Check remaining tenants.settings content
SELECT 
  id, 
  name, 
  settings,
  jsonb_object_keys(settings) as setting_keys
FROM public.tenants 
WHERE settings IS NOT NULL;

-- Check tenant_info table
SELECT 
  tenant_id,
  description,
  address,
  phone,
  email,
  operating_hours,
  logo_url,
  instagram_url,
  tiktok_url,
  twitter_url,
  facebook_url
FROM public.tenant_info;

-- =====================================================
-- 5. OPTIONAL: ADD ORDER SETTINGS TO tenant_info TABLE
-- =====================================================

-- If you want to move order settings to tenant_info as well, 
-- first add the columns:
/*
ALTER TABLE public.tenant_info 
ADD COLUMN IF NOT EXISTS auto_accept_orders boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS require_phone_verification boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_guest_checkout boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS minimum_order_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_delivery_threshold numeric DEFAULT 0;

-- Then migrate the data:
UPDATE public.tenant_info 
SET 
  auto_accept_orders = COALESCE((t.settings->>'auto_accept_orders')::boolean, false),
  require_phone_verification = COALESCE((t.settings->>'require_phone_verification')::boolean, false),
  allow_guest_checkout = COALESCE((t.settings->>'allow_guest_checkout')::boolean, true),
  minimum_order_amount = COALESCE((t.settings->>'minimum_order_amount')::numeric, 0),
  delivery_fee = COALESCE((t.settings->>'delivery_fee')::numeric, 0),
  free_delivery_threshold = COALESCE((t.settings->>'free_delivery_threshold')::numeric, 0)
FROM public.tenants t
WHERE tenant_info.tenant_id = t.id;

-- Finally, clear tenants.settings completely:
UPDATE public.tenants SET settings = '{}'::jsonb;
*/

-- =====================================================
-- SUMMARY
-- =====================================================
-- After running this script:
-- 1. ✅ Removed unused tables: tenant_settings, tenants_backup, tenants_settings_backup
-- 2. ✅ Cleaned up tenants.settings to only contain order settings
-- 3. ✅ All store info, social media, and display settings are now in tenant_info table
-- 4. ✅ No more duplicate data between the two tables
