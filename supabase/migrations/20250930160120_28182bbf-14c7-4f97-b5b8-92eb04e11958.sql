-- Create table for parental controls
CREATE TABLE IF NOT EXISTS parental_controls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  screen_time_limit INTEGER DEFAULT 120, -- in minutes
  bedtime TEXT DEFAULT '21:00',
  app_restrictions JSONB DEFAULT '[]'::jsonb,
  content_filter_level TEXT DEFAULT 'moderate' CHECK (content_filter_level IN ('strict', 'moderate', 'relaxed')),
  location_tracking BOOLEAN DEFAULT true,
  purchase_approval_required BOOLEAN DEFAULT true,
  daily_spending_limit NUMERIC DEFAULT 10.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

-- Create table for device configurations (NFC scanners, checkpoints)
CREATE TABLE IF NOT EXISTS device_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK (device_type IN ('entrance', 'bus', 'checkpoint')),
  location TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('entrance', 'exit', 'both')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for checkpoint logs
CREATE TABLE IF NOT EXISTS checkpoint_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT REFERENCES device_configs(device_id),
  student_id UUID REFERENCES students(id),
  student_name TEXT,
  nfc_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
  location TEXT NOT NULL,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for offline scan queue
CREATE TABLE IF NOT EXISTS offline_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT,
  scan_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for meal orders (parent orders for kitchen)
CREATE TABLE IF NOT EXISTS meal_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES students(id),
  meal_id UUID REFERENCES meals(id),
  order_date DATE NOT NULL,
  serving_time TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  special_instructions TEXT,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE parental_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parental_controls
CREATE POLICY "Parents can manage their children's controls"
ON parental_controls
FOR ALL
USING (parent_id = auth.uid());

CREATE POLICY "Students can view their own controls"
ON parental_controls
FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE profile_id = auth.uid()));

-- RLS Policies for device_configs
CREATE POLICY "Admins can manage device configs"
ON device_configs
FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can view device configs"
ON device_configs
FOR SELECT
USING (auth.role() = 'authenticated');

-- RLS Policies for checkpoint_logs
CREATE POLICY "Admins can manage checkpoint logs"
ON checkpoint_logs
FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teachers can view checkpoint logs"
ON checkpoint_logs
FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));

-- RLS Policies for offline_scans
CREATE POLICY "Admins can manage offline scans"
ON offline_scans
FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for meal_orders
CREATE POLICY "Parents can manage their orders"
ON meal_orders
FOR ALL
USING (parent_id = auth.uid());

CREATE POLICY "Admins can view all orders"
ON meal_orders
FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Kitchen staff can manage orders"
ON meal_orders
FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));