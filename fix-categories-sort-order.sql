-- Fix Categories Sort Order Issues
-- This script fixes duplicate sort_order values and adds proper constraints

-- Step 1: Fix existing duplicate sort_order values
-- For each tenant, reassign sort_order values sequentially starting from 1

-- Fix tenant 0a107d04-94af-49be-9598-e6e8cac45465
UPDATE categories 
SET sort_order = 1 
WHERE tenant_id = '0a107d04-94af-49be-9598-e6e8cac45465' 
AND name = 'ad';

UPDATE categories 
SET sort_order = 2 
WHERE tenant_id = '0a107d04-94af-49be-9598-e6e8cac45465' 
AND name = 'bab';

UPDATE categories 
SET sort_order = 3 
WHERE tenant_id = '0a107d04-94af-49be-9598-e6e8cac45465' 
AND name = 'Matcha';

-- Fix tenant b488ff3d-0c83-4878-8dbc-a330840027c9
UPDATE categories 
SET sort_order = 1 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'catnegative';

UPDATE categories 
SET sort_order = 2 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'cat9';

UPDATE categories 
SET sort_order = 3 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'Doodle 2 edit edit edit edit edit edit';

UPDATE categories 
SET sort_order = 4 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'Doodle 1 edit';

UPDATE categories 
SET sort_order = 5 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'Hand Draw';

UPDATE categories 
SET sort_order = 6 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'Digital Draw';

UPDATE categories 
SET sort_order = 7 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'cat5';

UPDATE categories 
SET sort_order = 8 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'cat6';

UPDATE categories 
SET sort_order = 9 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'cat7';

UPDATE categories 
SET sort_order = 10 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'cat8';

UPDATE categories 
SET sort_order = 11 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'cat10';

UPDATE categories 
SET sort_order = 12 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'cat11';

UPDATE categories 
SET sort_order = 13 
WHERE tenant_id = 'b488ff3d-0c83-4878-8dbc-a330840027c9' 
AND name = 'cat12';

-- Step 2: Add unique constraint to prevent future duplicates
-- This ensures that within each tenant, sort_order values are unique

-- First, drop the existing unique constraint if it exists
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_tenant_sort_order_unique;

-- Add the new unique constraint
ALTER TABLE categories 
ADD CONSTRAINT categories_tenant_sort_order_unique 
UNIQUE (tenant_id, sort_order);

-- Step 3: Add a comment explaining the constraint
COMMENT ON CONSTRAINT categories_tenant_sort_order_unique ON categories 
IS 'Ensures unique sort_order within each tenant for proper category ordering';
