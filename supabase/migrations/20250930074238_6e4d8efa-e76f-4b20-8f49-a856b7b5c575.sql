-- Update profiles policies to include developer role
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins and developers can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin'::user_role, 'developer'::user_role)
  )
);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins and developers can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin'::user_role, 'developer'::user_role)
  )
);

-- Update student policies
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
CREATE POLICY "Admins and developers can manage students" 
ON public.students 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin'::user_role, 'developer'::user_role)
  )
);

-- Update teacher policies
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
CREATE POLICY "Admins and developers can manage teachers" 
ON public.teachers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin'::user_role, 'developer'::user_role)
  )
);

-- Update driver policies
DROP POLICY IF EXISTS "Admins can manage drivers" ON public.drivers;
CREATE POLICY "Admins and developers can manage drivers" 
ON public.drivers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin'::user_role, 'developer'::user_role)
  )
);

-- Update buses policies
DROP POLICY IF EXISTS "Admins can manage buses" ON public.buses;
CREATE POLICY "Admins and developers can manage buses" 
ON public.buses 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin'::user_role, 'developer'::user_role)
  )
);

-- Update classes policies
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins and developers can manage classes" 
ON public.classes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin'::user_role, 'developer'::user_role)
  )
);

-- Update routes policies
DROP POLICY IF EXISTS "Admins can manage routes" ON public.routes;
CREATE POLICY "Admins and developers can manage routes" 
ON public.routes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin'::user_role, 'developer'::user_role)
  )
);

-- Update other critical tables
DROP POLICY IF EXISTS "Admins can manage billing history" ON public.billing_history;
CREATE POLICY "Admins and developers can manage billing history" 
ON public.billing_history 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin'::user_role, 'developer'::user_role)
  )
);

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.billing_subscriptions;
CREATE POLICY "Admins and developers can manage subscriptions" 
ON public.billing_subscriptions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin'::user_role, 'developer'::user_role)
  )
);