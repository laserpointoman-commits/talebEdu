-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Attendance staff can view relevant profiles" ON profiles;
DROP POLICY IF EXISTS "Attendance staff can create checkpoint logs" ON checkpoint_logs;
DROP POLICY IF EXISTS "Attendance staff can view checkpoint logs" ON checkpoint_logs;
DROP POLICY IF EXISTS "Bus attendance staff can manage boarding logs" ON bus_boarding_logs;
DROP POLICY IF EXISTS "Attendance staff can view students" ON students;

-- Create new policies for attendance staff
CREATE POLICY "Attendance staff can view relevant profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('school_attendance', 'bus_attendance', 'admin')
  )
);

CREATE POLICY "Attendance staff can create checkpoint logs"
ON checkpoint_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('school_attendance', 'bus_attendance', 'admin')
  )
);

CREATE POLICY "Attendance staff can view checkpoint logs"
ON checkpoint_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('school_attendance', 'bus_attendance', 'admin', 'teacher')
  )
);

CREATE POLICY "Bus attendance staff can manage boarding logs"
ON bus_boarding_logs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('bus_attendance', 'admin', 'driver')
  )
);

CREATE POLICY "Attendance staff can view students"
ON students FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('school_attendance', 'bus_attendance', 'admin', 'teacher')
  )
);