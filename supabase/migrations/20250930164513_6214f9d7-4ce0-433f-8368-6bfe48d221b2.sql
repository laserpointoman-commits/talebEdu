-- First, drop ALL existing policies on profiles to ensure no recursion
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles can be created by users" ON profiles;
DROP POLICY IF EXISTS "Profiles can be updated by owner" ON profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Enable read access for all users" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for authenticated users only" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Now fix the students table policies
DROP POLICY IF EXISTS "Students can be viewed by everyone" ON students;
DROP POLICY IF EXISTS "Students can be created by admins" ON students;
DROP POLICY IF EXISTS "Students can be updated by admins" ON students;
DROP POLICY IF EXISTS "Students can be deleted by admins" ON students;

-- Create simple policies for students table
CREATE POLICY "Enable read access for authenticated users" 
ON students FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" 
ON students FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" 
ON students FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" 
ON students FOR DELETE 
USING (auth.role() = 'authenticated');

-- Fix any other tables that might have recursive policies
-- Check teachers table
DROP POLICY IF EXISTS "Teachers can be viewed by everyone" ON teachers;
DROP POLICY IF EXISTS "Teachers can be managed by admins" ON teachers;

CREATE POLICY "Enable read for authenticated users" 
ON teachers FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" 
ON teachers FOR ALL 
USING (auth.role() = 'authenticated');

-- Check employees table  
DROP POLICY IF EXISTS "Employees can view own record" ON employees;
DROP POLICY IF EXISTS "Employees can only view own sensitive data" ON employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;

CREATE POLICY "Enable read for authenticated users" 
ON employees FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" 
ON employees FOR ALL 
USING (auth.role() = 'authenticated');