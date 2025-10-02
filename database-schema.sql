-- Kopi Pendekar Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price integer NOT NULL CHECK (price >= 0),
  photo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text,
  customer_name text NOT NULL,
  phone text NOT NULL,
  pickup_date date NOT NULL,
  notes text,
  payment_method text CHECK (payment_method IN ('TRANSFER', 'QRIS', 'COD')) DEFAULT 'TRANSFER',
  status text CHECK (status IN ('BELUM BAYAR', 'SUDAH BAYAR', 'DIBATALKAN')) DEFAULT 'BELUM BAYAR',
  subtotal integer NOT NULL,
  discount integer DEFAULT 0,
  service_fee integer DEFAULT 0,
  total integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name_snapshot text NOT NULL,
  price_snapshot integer NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  notes text,
  line_total integer NOT NULL
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  payment_type text CHECK (payment_type IN ('TRANSFER', 'QRIS', 'COD')) DEFAULT 'TRANSFER',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,

  -- Bank transfer details
  bank_name text,
  account_number text,
  account_holder text,

  -- QRIS details
  qris_image_url text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on payment_methods table
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Payment methods are publicly readable"
  ON payment_methods FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_sort_order ON payment_methods(sort_order);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(payment_type);

-- Insert default payment methods
INSERT INTO payment_methods (name, description, payment_type, sort_order, bank_name, account_number, account_holder) VALUES
  ('Transfer Bank BCA', 'Transfer melalui rekening bank BCA', 'TRANSFER', 1, 'BCA', '1234567890', 'Kopi Pendekar'),
  ('QRIS', 'Pembayaran melalui QRIS', 'QRIS', 2, NULL, NULL, NULL),
  ('Cash on Delivery', 'Bayar di tempat (COD)', 'COD', 3, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
DROP POLICY IF EXISTS "Active menu items are publicly readable" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can view all menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can delete menu items" ON menu_items;
DROP POLICY IF EXISTS "Orders are publicly readable" ON orders;
DROP POLICY IF EXISTS "Service role can insert orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Order items are publicly readable" ON order_items;
DROP POLICY IF EXISTS "Service role can insert order items" ON order_items;
DROP POLICY IF EXISTS "Payment proofs are publicly readable" ON payment_proofs;
DROP POLICY IF EXISTS "Authenticated users can manage payment proofs" ON payment_proofs;

-- RLS Policies for categories
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for menu_items
CREATE POLICY "Active menu items are publicly readable"
  ON menu_items FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for orders
CREATE POLICY "Orders are publicly readable"
  ON orders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Order items are publicly readable"
  ON order_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for payment_proofs
CREATE POLICY "Payment proofs are publicly readable"
  ON payment_proofs FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage payment proofs"
  ON payment_proofs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_order ON payment_proofs(order_id);

-- Insert sample categories
INSERT INTO categories (name, sort_order) VALUES
  ('Kopi Susu', 1),
  ('Cold Brew', 2),
  ('Signature', 3),
  ('Non-Coffee', 4),
  ('Snack', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (category_id, name, description, price, photo_url, is_active)
SELECT
  c.id,
  'Kopi Susu Pendekar',
  'Perpaduan sempurna espresso dengan susu segar pilihan',
  18000,
  'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
FROM categories c WHERE c.name = 'Kopi Susu'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, photo_url, is_active)
SELECT
  c.id,
  'Kopi Susu Gula Aren',
  'Kopi susu dengan sentuhan manis gula aren alami',
  20000,
  'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
FROM categories c WHERE c.name = 'Kopi Susu'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, photo_url, is_active)
SELECT
  c.id,
  'Cold Brew Hitam',
  'Seduhan dingin 12 jam untuk rasa yang smooth dan bold',
  16000,
  'https://images.pexels.com/photos/1251175/pexels-photo-1251175.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
FROM categories c WHERE c.name = 'Cold Brew'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, photo_url, is_active)
SELECT
  c.id,
  'Cold Brew Latte',
  'Cold brew dengan susu creamy dan es batu',
  22000,
  'https://images.pexels.com/photos/1797103/pexels-photo-1797103.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
FROM categories c WHERE c.name = 'Cold Brew'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, photo_url, is_active)
SELECT
  c.id,
  'Americano',
  'Espresso shot dengan air panas, simple dan kuat',
  15000,
  'https://images.pexels.com/photos/1251176/pexels-photo-1251176.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
FROM categories c WHERE c.name = 'Signature'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, photo_url, is_active)
SELECT
  c.id,
  'Caramel Macchiato',
  'Espresso, susu, vanilla, dan saus karamel',
  25000,
  'https://images.pexels.com/photos/5946968/pexels-photo-5946968.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
FROM categories c WHERE c.name = 'Signature'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, photo_url, is_active)
SELECT
  c.id,
  'Matcha Latte',
  'Matcha premium Jepang dengan susu full cream',
  22000,
  'https://images.pexels.com/photos/5946971/pexels-photo-5946971.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
FROM categories c WHERE c.name = 'Non-Coffee'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, photo_url, is_active)
SELECT
  c.id,
  'Chocolate Milkshake',
  'Cokelat Belgium premium blend dengan es krim vanilla',
  24000,
  'https://images.pexels.com/photos/1098515/pexels-photo-1098515.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
FROM categories c WHERE c.name = 'Non-Coffee'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, photo_url, is_active)
SELECT
  c.id,
  'Croissant Butter',
  'Croissant buttery berlapis-lapis, fresh from oven',
  15000,
  'https://images.pexels.com/photos/2135677/pexels-photo-2135677.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
FROM categories c WHERE c.name = 'Snack'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, photo_url, is_active)
SELECT
  c.id,
  'Banana Cake',
  'Cake pisang homemade dengan topping cream cheese',
  18000,
  'https://images.pexels.com/photos/3992133/pexels-photo-3992133.jpeg?auto=compress&cs=tinysrgb&w=400',
  true
FROM categories c WHERE c.name = 'Snack'
ON CONFLICT DO NOTHING;