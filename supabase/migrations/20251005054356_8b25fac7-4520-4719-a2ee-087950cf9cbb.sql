-- Create canteen_categories table
CREATE TABLE IF NOT EXISTS public.canteen_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  icon TEXT DEFAULT 'package',
  color TEXT DEFAULT 'hsl(var(--primary))',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.canteen_categories ENABLE ROW LEVEL SECURITY;

-- Policies for canteen_categories
CREATE POLICY "Everyone can view categories"
  ON public.canteen_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.canteen_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default categories
INSERT INTO public.canteen_categories (name, name_ar, icon, display_order) VALUES
  ('Main', 'الأطباق الرئيسية', '🍽️', 1),
  ('Drinks', 'المشروبات', '☕', 2),
  ('Healthy', 'صحي', '🍎', 3),
  ('Bakery', 'المخبوزات', '🍪', 4),
  ('Snacks', 'وجبات خفيفة', '🍿', 5),
  ('Pizza', 'بيتزا', '🍕', 6);

-- Add stock quantity to canteen_items
ALTER TABLE public.canteen_items ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE public.canteen_items ADD COLUMN IF NOT EXISTS low_stock_alert INTEGER DEFAULT 10;
ALTER TABLE public.canteen_items ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;
ALTER TABLE public.canteen_items ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_canteen_items_category ON public.canteen_items(category);
CREATE INDEX IF NOT EXISTS idx_canteen_items_available ON public.canteen_items(available);
CREATE INDEX IF NOT EXISTS idx_canteen_categories_active ON public.canteen_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_canteen_categories_order ON public.canteen_categories(display_order);