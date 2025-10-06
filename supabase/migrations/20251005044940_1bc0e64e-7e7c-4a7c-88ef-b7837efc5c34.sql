-- Create table for parental controls on canteen purchases
CREATE TABLE IF NOT EXISTS public.canteen_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  allowed_items UUID[] DEFAULT '{}', -- Array of allowed canteen_item IDs
  daily_limit NUMERIC DEFAULT NULL, -- Daily spending limit in OMR
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id)
);

-- Enable RLS
ALTER TABLE public.canteen_restrictions ENABLE ROW LEVEL SECURITY;

-- Parents can manage their children's restrictions
CREATE POLICY "Parents can manage their children's canteen restrictions"
ON public.canteen_restrictions
FOR ALL
TO authenticated
USING (
  parent_id = auth.uid() OR
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
)
WITH CHECK (
  parent_id = auth.uid() OR
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- Canteen staff can view restrictions
CREATE POLICY "Canteen staff can view restrictions"
ON public.canteen_restrictions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('canteen', 'admin')
  )
);

-- Create canteen orders table
CREATE TABLE IF NOT EXISTS public.canteen_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  items JSONB NOT NULL, -- [{item_id, name, price, quantity}]
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'wallet')),
  transaction_id UUID REFERENCES public.wallet_transactions(id),
  served_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.canteen_orders ENABLE ROW LEVEL SECURITY;

-- Canteen staff and admins can manage orders
CREATE POLICY "Canteen staff can manage orders"
ON public.canteen_orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('canteen', 'admin')
  )
);

-- Students and parents can view their orders
CREATE POLICY "Students and parents can view orders"
ON public.canteen_orders
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students 
    WHERE profile_id = auth.uid() 
    OR parent_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_canteen_orders_student ON canteen_orders(student_id);
CREATE INDEX IF NOT EXISTS idx_canteen_orders_created ON canteen_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canteen_restrictions_student ON canteen_restrictions(student_id);