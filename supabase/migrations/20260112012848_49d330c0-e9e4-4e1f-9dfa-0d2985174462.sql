-- Allow supervisors to see the students assigned to their bus and related attendance logs

-- student_bus_assignments: supervisors can view assignments for their own bus
CREATE POLICY "Supervisors can view their bus assignments"
ON public.student_bus_assignments
FOR SELECT
TO authenticated
USING (
  bus_id IN (
    SELECT b.id
    FROM public.buses b
    WHERE b.supervisor_id = auth.uid()
  )
);

-- students: supervisors can view students that are actively assigned to their bus
CREATE POLICY "Supervisors can view students on their buses"
ON public.students
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT sba.student_id
    FROM public.student_bus_assignments sba
    JOIN public.buses b ON b.id = sba.bus_id
    WHERE b.supervisor_id = auth.uid()
      AND sba.is_active = true
  )
);

-- bus_boarding_logs: supervisors can view logs for their bus
CREATE POLICY "Supervisors can view boarding logs for their buses"
ON public.bus_boarding_logs
FOR SELECT
TO authenticated
USING (
  bus_id IN (
    SELECT b.id
    FROM public.buses b
    WHERE b.supervisor_id = auth.uid()
  )
);
