-- Create canteen_items table for canteen products
CREATE TABLE IF NOT EXISTS public.canteen_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  icon TEXT DEFAULT 'package',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.canteen_items ENABLE ROW LEVEL SECURITY;

-- Create policies for canteen_items
CREATE POLICY "Everyone can view canteen items" 
ON public.canteen_items 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage canteen items" 
ON public.canteen_items 
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

-- Create transport_routes table
CREATE TABLE IF NOT EXISTS public.transport_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  bus_id UUID,
  driver_id UUID,
  supervisor_id UUID,
  stops JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;

-- Create policies for transport_routes
CREATE POLICY "Everyone can view transport routes" 
ON public.transport_routes 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage transport routes" 
ON public.transport_routes 
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

-- Create triggers for updating updated_at
CREATE TRIGGER update_canteen_items_updated_at
BEFORE UPDATE ON public.canteen_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transport_routes_updated_at
BEFORE UPDATE ON public.transport_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();