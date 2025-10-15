-- Add created_at column to order_items table
-- This script adds the missing created_at column to the order_items table

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Add updated_at column as well for consistency
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON public.order_items(created_at);

-- Add comment to document the columns
COMMENT ON COLUMN public.order_items.created_at IS 'Timestamp when the order item was created';
COMMENT ON COLUMN public.order_items.updated_at IS 'Timestamp when the order item was last updated';
