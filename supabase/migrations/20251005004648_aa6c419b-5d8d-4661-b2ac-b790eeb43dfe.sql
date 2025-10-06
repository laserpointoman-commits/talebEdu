-- Create bus boarding logs table to track when students enter and exit buses
CREATE TABLE IF NOT EXISTS public.bus_boarding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('boarded', 'exited')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bus_boarding_logs ENABLE ROW LEVEL SECURITY;

-- Parents can view their children's boarding logs
CREATE POLICY "Parents can view their children's boarding logs"
ON public.bus_boarding_logs
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE parent_id = auth.uid()
  )
);

-- Students can view their own boarding logs
CREATE POLICY "Students can view their own boarding logs"
ON public.bus_boarding_logs
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE profile_id = auth.uid()
  )
);

-- Drivers and admins can insert boarding logs
CREATE POLICY "Drivers and admins can manage boarding logs"
ON public.bus_boarding_logs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'driver')
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bus_boarding_logs_student_id ON public.bus_boarding_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_bus_boarding_logs_timestamp ON public.bus_boarding_logs(timestamp DESC);