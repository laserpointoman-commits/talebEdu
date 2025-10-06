-- Create bus_routes table for detailed route information
CREATE TABLE IF NOT EXISTS public.bus_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  route_name_ar TEXT,
  stops JSONB NOT NULL DEFAULT '[]',
  morning_schedule JSONB,
  afternoon_schedule JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create student_bus_assignments table to link students to buses
CREATE TABLE IF NOT EXISTS public.student_bus_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.bus_routes(id) ON DELETE CASCADE,
  pickup_stop TEXT NOT NULL,
  dropoff_stop TEXT NOT NULL,
  pickup_time TIME,
  dropoff_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bus_locations table for real-time tracking
CREATE TABLE IF NOT EXISTS public.bus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  current_stop TEXT,
  next_stop TEXT,
  eta_minutes INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create transport_requests table for parent quick actions
CREATE TABLE IF NOT EXISTS public.transport_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  parent_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('absent', 'no_morning_bus', 'no_afternoon_bus', 'parent_pickup', 'parent_dropoff')),
  request_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_bus_assignments_student ON public.student_bus_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_bus_assignments_bus ON public.student_bus_assignments(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_timestamp ON public.bus_locations(bus_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transport_requests_student ON public.transport_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_parent ON public.transport_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_date ON public.transport_requests(request_date);

-- Enable RLS
ALTER TABLE public.bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_bus_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bus_routes
CREATE POLICY "Everyone can view active bus routes"
  ON public.bus_routes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage bus routes"
  ON public.bus_routes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for student_bus_assignments
CREATE POLICY "Students can view their own bus assignment"
  ON public.student_bus_assignments FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's bus assignments"
  ON public.student_bus_assignments FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins and drivers can view all bus assignments"
  ON public.student_bus_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'driver')
    )
  );

CREATE POLICY "Admins can manage bus assignments"
  ON public.student_bus_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for bus_locations
CREATE POLICY "Students can view their assigned bus location"
  ON public.bus_locations FOR SELECT
  USING (
    bus_id IN (
      SELECT bus_id FROM student_bus_assignments 
      WHERE student_id IN (
        SELECT id FROM students WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Parents can view their children's bus location"
  ON public.bus_locations FOR SELECT
  USING (
    bus_id IN (
      SELECT DISTINCT bus_id FROM student_bus_assignments 
      WHERE student_id IN (
        SELECT id FROM students WHERE parent_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and drivers can view all bus locations"
  ON public.bus_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'driver')
    )
  );

CREATE POLICY "Drivers can update their bus location"
  ON public.bus_locations FOR INSERT
  WITH CHECK (
    bus_id IN (
      SELECT id FROM buses 
      WHERE driver_id IN (
        SELECT id FROM drivers WHERE profile_id = auth.uid()
      )
    )
  );

-- RLS Policies for transport_requests
CREATE POLICY "Parents can create transport requests for their children"
  ON public.transport_requests FOR INSERT
  WITH CHECK (
    parent_id = auth.uid() AND
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their transport requests"
  ON public.transport_requests FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Admins can view all transport requests"
  ON public.transport_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update transport requests"
  ON public.transport_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bus_routes_updated_at
  BEFORE UPDATE ON public.bus_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_bus_assignments_updated_at
  BEFORE UPDATE ON public.student_bus_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transport_requests_updated_at
  BEFORE UPDATE ON public.transport_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();