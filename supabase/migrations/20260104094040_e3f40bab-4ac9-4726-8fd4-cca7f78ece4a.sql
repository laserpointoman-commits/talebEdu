-- Add 'supervisor' and 'parent' roles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent', 'student', 'driver', 'finance', 'canteen', 'school_attendance', 'bus_attendance', 'supervisor', 'developer');
  ELSE
    -- Add new values if they don't exist
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supervisor';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Add supervisor_id to buses table
ALTER TABLE buses ADD COLUMN IF NOT EXISTS supervisor_id uuid REFERENCES profiles(id);

-- Create bus_trips table for live tracking
CREATE TABLE IF NOT EXISTS bus_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES drivers(id),
  supervisor_id uuid REFERENCES profiles(id),
  trip_type text NOT NULL DEFAULT 'morning', -- morning, afternoon
  status text NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  current_latitude numeric,
  current_longitude numeric,
  current_stop text,
  next_stop text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on bus_trips
ALTER TABLE bus_trips ENABLE ROW LEVEL SECURITY;

-- RLS policies for bus_trips
CREATE POLICY "Admins can manage all trips" ON bus_trips
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers and supervisors can manage their trips" ON bus_trips
  FOR ALL USING (
    driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
    OR supervisor_id = auth.uid()
  );

CREATE POLICY "Parents can view trips of their children's buses" ON bus_trips
  FOR SELECT USING (
    bus_id IN (
      SELECT sba.bus_id FROM student_bus_assignments sba
      JOIN students s ON s.id = sba.student_id
      WHERE s.parent_id = auth.uid()
    )
  );

-- Create supervisors table
CREATE TABLE IF NOT EXISTS supervisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) UNIQUE,
  employee_id text NOT NULL,
  bus_id uuid REFERENCES buses(id),
  phone text,
  emergency_contact text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on supervisors
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;

-- RLS policies for supervisors
CREATE POLICY "Admins can manage supervisors" ON supervisors
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can view own record" ON supervisors
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Everyone can view supervisors" ON supervisors
  FOR SELECT USING (true);

-- Create allowance_settings table for parent control over student spending
CREATE TABLE IF NOT EXISTS allowance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL UNIQUE,
  parent_id uuid REFERENCES profiles(id) NOT NULL,
  daily_limit numeric DEFAULT 5.000,
  weekly_limit numeric DEFAULT 25.000,
  auto_deduct_on_entry boolean DEFAULT false,
  entry_allowance_amount numeric DEFAULT 1.000,
  blocked_categories text[] DEFAULT '{}',
  allowed_categories text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on allowance_settings
ALTER TABLE allowance_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for allowance_settings
CREATE POLICY "Parents can manage their children's allowance" ON allowance_settings
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "Admins can view all allowance settings" ON allowance_settings
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for bus_trips
ALTER PUBLICATION supabase_realtime ADD TABLE bus_trips;

-- Update trigger for bus_trips
CREATE OR REPLACE FUNCTION update_bus_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bus_trips_timestamp
  BEFORE UPDATE ON bus_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_bus_trips_updated_at();