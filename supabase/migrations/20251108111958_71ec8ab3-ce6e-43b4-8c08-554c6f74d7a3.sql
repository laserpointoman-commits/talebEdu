-- COMPREHENSIVE SECURITY FIX - FINAL VERSION
-- Handles all policy dependencies correctly

BEGIN;

-- ============================================================================
-- STEP 1: Create/verify user_role_assignments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Migrate roles from profiles to user_role_assignments
-- ============================================================================

INSERT INTO public.user_role_assignments (user_id, role)
SELECT id, role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- STEP 3: Drop functions with CASCADE (drops dependent policies)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;

-- ============================================================================
-- STEP 4: Recreate security functions
-- ============================================================================

CREATE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

CREATE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role::text INTO user_role
    FROM user_role_assignments
    WHERE user_id = get_user_role.user_id
    LIMIT 1;
    
    RETURN user_role;
END;
$$;

-- ============================================================================
-- STEP 5: Drop ALL existing profiles policies
-- ============================================================================

DROP POLICY IF EXISTS "admins_delete_all" ON profiles;
DROP POLICY IF EXISTS "admins_select_all" ON profiles;
DROP POLICY IF EXISTS "admins_update_all" ON profiles;
DROP POLICY IF EXISTS "admins_insert_all" ON profiles;
DROP POLICY IF EXISTS "users_select_own" ON profiles;
DROP POLICY IF EXISTS "users_update_own" ON profiles;
DROP POLICY IF EXISTS "users_insert_own" ON profiles;
DROP POLICY IF EXISTS "users_delete_own" ON profiles;
DROP POLICY IF EXISTS "admins can select all profiles" ON profiles;
DROP POLICY IF EXISTS "admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "admins can delete profiles" ON profiles;

-- ============================================================================
-- STEP 6: Recreate profiles policies (admin only, no developer)
-- ============================================================================

CREATE POLICY "admins_delete_all"
ON profiles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_select_all"
ON profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_update_all"
ON profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_insert_all"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "users_select_own"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- ============================================================================
-- STEP 7: Drop dangerous USING(true) policies
-- ============================================================================

DROP POLICY IF EXISTS "employees_all_authenticated" ON employees;
DROP POLICY IF EXISTS "teachers_all_authenticated" ON teachers;

-- ============================================================================
-- STEP 8: Create proper employees policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all employees" ON employees;
DROP POLICY IF EXISTS "Employees can view own record" ON employees;
DROP POLICY IF EXISTS "Employees can update own basic info" ON employees;

CREATE POLICY "Admins can manage all employees"
ON employees FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view own record"
ON employees FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Employees can update own basic info"
ON employees FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- ============================================================================
-- STEP 9: Create proper teachers policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can view own record" ON teachers;
DROP POLICY IF EXISTS "Everyone can view basic teacher info" ON teachers;

CREATE POLICY "Admins can manage all teachers"
ON teachers FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view own record"
ON teachers FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Everyone can view basic teacher info"
ON teachers FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- STEP 10: Fix other tables - remove developer role
-- ============================================================================

-- role_feature_visibility
DROP POLICY IF EXISTS "Admins can manage visibility settings" ON role_feature_visibility;
CREATE POLICY "Admins can manage visibility settings"
ON role_feature_visibility FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- buses  
DROP POLICY IF EXISTS "Admins and developers can manage buses" ON buses;
DROP POLICY IF EXISTS "Admins can manage buses" ON buses;
CREATE POLICY "Admins can manage buses"
ON buses FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- billing_history
DROP POLICY IF EXISTS "Admins and developers can manage billing history" ON billing_history;
DROP POLICY IF EXISTS "Admins can manage billing history" ON billing_history;
CREATE POLICY "Admins can manage billing history"
ON billing_history FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- drivers
DROP POLICY IF EXISTS "Only admins can view all drivers" ON drivers;
DROP POLICY IF EXISTS "Admins can view all drivers" ON drivers;
CREATE POLICY "Admins can view all drivers"
ON drivers FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- STEP 11: Create user_role_assignments policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins can manage all role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_role_assignments;
DROP POLICY IF EXISTS "Users can view own roles" ON user_role_assignments;

CREATE POLICY "Admins can manage all role assignments"
ON user_role_assignments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON user_role_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
  role_count INT;
  emp_bad INT;
  teach_bad INT;
  emp_good INT;
  teach_good INT;
BEGIN
  SELECT COUNT(*) INTO role_count FROM user_role_assignments;
  SELECT COUNT(*) INTO emp_bad FROM pg_policies WHERE tablename = 'employees' AND policyname = 'employees_all_authenticated';
  SELECT COUNT(*) INTO teach_bad FROM pg_policies WHERE tablename = 'teachers' AND policyname = 'teachers_all_authenticated';
  SELECT COUNT(*) INTO emp_good FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Admins can manage all employees';
  SELECT COUNT(*) INTO teach_good FROM pg_policies WHERE tablename = 'teachers' AND policyname = 'Admins can manage all teachers';
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE '       SECURITY FIX VERIFICATION';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Roles migrated: % ✓', role_count;
  RAISE NOTICE 'Bad employees policy: % (expect 0) %', emp_bad, CASE WHEN emp_bad = 0 THEN '✓' ELSE '✗' END;
  RAISE NOTICE 'Bad teachers policy: % (expect 0) %', teach_bad, CASE WHEN teach_bad = 0 THEN '✓' ELSE '✗' END;
  RAISE NOTICE 'Good employees policy: % (expect 1) %', emp_good, CASE WHEN emp_good = 1 THEN '✓' ELSE '✗' END;
  RAISE NOTICE 'Good teachers policy: % (expect 1) %', teach_good, CASE WHEN teach_good = 1 THEN '✓' ELSE '✗' END;
  
  IF role_count = 0 THEN
    RAISE EXCEPTION '✗ FAILED: No roles migrated';
  END IF;
  IF emp_bad > 0 THEN
    RAISE EXCEPTION '✗ FAILED: Bad employees policy still exists';
  END IF;
  IF teach_bad > 0 THEN
    RAISE EXCEPTION '✗ FAILED: Bad teachers policy still exists';
  END IF;
  IF emp_good = 0 THEN
    RAISE EXCEPTION '✗ FAILED: Good employees policy not created';
  END IF;
  IF teach_good = 0 THEN
    RAISE EXCEPTION '✗ FAILED: Good teachers policy not created';
  END IF;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE '   ✅ ALL SECURITY FIXES APPLIED';
  RAISE NOTICE '==========================================';
END $$;

COMMIT;