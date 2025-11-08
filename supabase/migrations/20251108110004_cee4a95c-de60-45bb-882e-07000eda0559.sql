-- Fix Students Table RLS - Remove overly permissive policy and add proper role-based policies

-- Drop the overly permissive policy that allows all authenticated users full access
DROP POLICY IF EXISTS "students_all_authenticated" ON public.students;

-- Admins have full access
CREATE POLICY "Admins can manage all students"
ON public.students
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view their class students"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'teacher'
  )
  AND (
    -- Teachers can see students in classes they teach
    class IN (
      SELECT tc.class_id::text
      FROM public.teacher_classes tc
      JOIN public.teachers t ON t.id = tc.teacher_id
      WHERE t.profile_id = auth.uid()
    )
  )
);

-- Parents can view and update only their own children
CREATE POLICY "Parents can view their children"
ON public.students
FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid()
);

CREATE POLICY "Parents can update their children"
ON public.students
FOR UPDATE
TO authenticated
USING (
  parent_id = auth.uid()
)
WITH CHECK (
  parent_id = auth.uid()
);

-- Students can view their own record (read-only)
CREATE POLICY "Students can view own record"
ON public.students
FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid()
);