-- Create store_items table for school stationery, books, and uniforms
CREATE TABLE public.store_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  stock_quantity INTEGER DEFAULT 100,
  low_stock_alert INTEGER DEFAULT 10,
  icon TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create store_orders table for tracking purchases
CREATE TABLE public.store_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id),
  parent_id UUID,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'wallet',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Store items are publicly readable
CREATE POLICY "Store items are viewable by everyone" 
ON public.store_items FOR SELECT USING (true);

-- Parents can view their children's orders
CREATE POLICY "Parents can view their children's orders" 
ON public.store_orders FOR SELECT 
USING (parent_id = auth.uid());

-- Parents can create orders for their children
CREATE POLICY "Parents can create orders" 
ON public.store_orders FOR INSERT 
WITH CHECK (parent_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_orders;