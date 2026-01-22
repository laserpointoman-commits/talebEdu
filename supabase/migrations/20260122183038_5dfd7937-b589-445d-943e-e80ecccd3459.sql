-- Allow bus devices logged in as driver/supervisor to read students by NFC
-- (BusAttendanceDevice queries public.students; current RLS policy excludes these roles)

BEGIN;

DROP POLICY IF EXISTS "Attendance staff can view students" ON public.students;

CREATE POLICY "Attendance staff can view students"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = ANY (
        ARRAY[
          'school_attendance',
          'bus_attendance',
          'admin',
          'teacher',
          'driver',
          'supervisor'
        ]::public.user_role[]
      )
  )
);

COMMIT;