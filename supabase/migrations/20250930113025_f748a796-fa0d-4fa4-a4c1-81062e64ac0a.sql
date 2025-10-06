-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Drivers are viewable by authenticated users" ON public.drivers;

-- Create a new policy: Only admins and developers can view all drivers
CREATE POLICY "Admins can view all drivers" 
ON public.drivers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin'::user_role, 'developer'::user_role)
  )
);

-- Create a policy: Drivers can view their own information
CREATE POLICY "Drivers can view own profile" 
ON public.drivers 
FOR SELECT 
USING (
  profile_id = auth.uid()
);

-- Create a policy: Teachers with transport management role can view drivers (optional - for future use)
-- This is commented out for now but can be enabled if you have transport managers
-- CREATE POLICY "Transport managers can view drivers" 
-- ON public.drivers 
-- FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1
--     FROM profiles
--     WHERE profiles.id = auth.uid() 
--     AND profiles.role = 'teacher'::user_role
--     AND EXISTS (
--       SELECT 1 FROM user_role_assignments 
--       WHERE user_id = profiles.id 
--       AND role = 'transport_manager'::user_role
--     )
--   )
-- );