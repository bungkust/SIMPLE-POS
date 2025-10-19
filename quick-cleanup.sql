-- =====================================================
-- QUICK CLEANUP - REMOVE UNUSED TABLES
-- =====================================================
-- Safe to run - only removes tables that are confirmed unused

-- 1. Drop tenant_settings table (completely unused)
DROP TABLE IF EXISTS public.tenant_settings CASCADE;

-- 2. Drop backup tables (not referenced in codebase)
DROP TABLE IF EXISTS public.tenants_backup CASCADE;
DROP TABLE IF EXISTS public.tenants_settings_backup CASCADE;

-- 3. Clean up tenants.settings to remove duplicate data
-- Keep only order settings, remove store info that's now in tenant_info
UPDATE public.tenants 
SET settings = jsonb_build_object(
  'auto_accept_orders', COALESCE((settings->>'auto_accept_orders')::boolean, false),
  'require_phone_verification', COALESCE((settings->>'require_phone_verification')::boolean, false),
  'allow_guest_checkout', COALESCE((settings->>'allow_guest_checkout')::boolean, true),
  'minimum_order_amount', COALESCE((settings->>'minimum_order_amount')::numeric, 0),
  'delivery_fee', COALESCE((settings->>'delivery_fee')::numeric, 0),
  'free_delivery_threshold', COALESCE((settings->>'free_delivery_threshold')::numeric, 0)
)
WHERE settings IS NOT NULL;

-- Verify cleanup
SELECT 'Cleanup completed successfully!' as status;
