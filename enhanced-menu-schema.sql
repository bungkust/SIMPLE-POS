-- =============================================
-- ENHANCED MENU SYSTEM DATABASE SCHEMA
-- =============================================

-- Create menu_discounts table for discount management
CREATE TABLE IF NOT EXISTS menu_discounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create menu_options table for option categories (Size, Topping, etc.)
CREATE TABLE IF NOT EXISTS menu_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL, -- "Size", "Topping", "Sugar Level", etc.
  selection_type VARCHAR(20) NOT NULL CHECK (selection_type IN ('single_required', 'single_optional', 'multiple')),
  max_selections INTEGER DEFAULT 1, -- For multiple choice, how many can be selected
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create menu_option_items table for individual choices within options
CREATE TABLE IF NOT EXISTS menu_option_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_option_id UUID NOT NULL REFERENCES menu_options(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Regular", "Large", "Extra Cheese", etc.
  additional_price DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add discount support to menu_items
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES menu_discounts(id),
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_options_menu_item_id ON menu_options(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_option_items_option_id ON menu_option_items(menu_option_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_id ON menu_items(discount_id);

-- Enable RLS on new tables
ALTER TABLE menu_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_option_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_discounts
CREATE POLICY "Authenticated users can manage discounts"
ON menu_discounts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view active discounts"
ON menu_discounts FOR SELECT
TO public
USING (is_active = true);

-- RLS Policies for menu_options
CREATE POLICY "Authenticated users can manage menu options"
ON menu_options FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view menu options"
ON menu_options FOR SELECT
TO public
USING (true);

-- RLS Policies for menu_option_items
CREATE POLICY "Authenticated users can manage option items"
ON menu_option_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view option items"
ON menu_option_items FOR SELECT
TO public
USING (true);

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Sample discount
INSERT INTO menu_discounts (name, description, discount_type, discount_value, is_active)
VALUES
  ('Promo Weekend', 'Diskon akhir pekan 20%', 'percentage', 20.00, true),
  ('Special Deal', 'Potongan harga Rp 5.000', 'fixed_amount', 5000.00, true)
ON CONFLICT DO NOTHING;

-- Update existing menu items with base_price (if they don't have it)
UPDATE menu_items SET base_price = price WHERE base_price = 0;

-- Add short_description to existing items (optional)
UPDATE menu_items SET short_description = LEFT(description, 100) WHERE short_description IS NULL AND description IS NOT NULL;

COMMENT ON TABLE menu_discounts IS 'Stores discount information for menu items';
COMMENT ON TABLE menu_options IS 'Stores option categories for menu items (Size, Topping, etc.)';
COMMENT ON TABLE menu_option_items IS 'Stores individual option choices within option categories';
