-- COMPLETE FIX for infinite recursion in profiles table
-- This will permanently fix the RLS policies

-- Step 1: Drop ALL existing policies on profiles (including any that might have been missed)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Drop the old is_admin function if it exists
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Step 3: Create a new security definer function that does NOT use RLS
-- This function bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    -- Direct query without RLS
    SELECT role::text INTO user_role
    FROM profiles
    WHERE id = user_id;
    
    RETURN user_role;
END;
$$;

-- Step 4: Create simple, non-recursive RLS policies

-- Allow users to view their own profile (no role check)
CREATE POLICY "users_select_own"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow users to update their own profile (no role check)
CREATE POLICY "users_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow users to insert their own profile (no role check)
CREATE POLICY "users_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow admin/developer to SELECT all profiles (using security definer function)
CREATE POLICY "admins_select_all"
ON profiles FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'developer')
);

-- Allow admin/developer to UPDATE all profiles (using security definer function)
CREATE POLICY "admins_update_all"
ON profiles FOR UPDATE
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'developer')
)
WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'developer')
);

-- Allow admin/developer to INSERT profiles (using security definer function)
CREATE POLICY "admins_insert_all"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'developer')
);

-- Allow admin/developer to DELETE profiles (using security definer function)
CREATE POLICY "admins_delete_all"
ON profiles FOR DELETE
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'developer')
);

-- Step 5: Also create helper function for checking specific roles
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role::text INTO user_role
    FROM profiles
    WHERE id = user_id;
    
    RETURN user_role = required_role;
END;
$$;

-- Step 6: Create helper function for checking multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(user_id uuid, required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role::text INTO user_role
    FROM profiles
    WHERE id = user_id;
    
    RETURN user_role = ANY(required_roles);
END;
$$;