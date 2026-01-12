-- Drop the recursive policy that was causing infinite recursion
DROP POLICY IF EXISTS "Supervisors can view students on their buses" ON public.students;
