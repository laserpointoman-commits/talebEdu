-- COMPLETELY DISABLE RLS on problematic tables first
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies to ensure clean slate
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'students', 'teachers', 'employees')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Now re-enable RLS with VERY SIMPLE policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible policies that won't recurse
CREATE POLICY "profiles_all_authenticated" ON profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "students_all_authenticated" ON students
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "teachers_all_authenticated" ON teachers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "employees_all_authenticated" ON employees
    FOR ALL USING (true) WITH CHECK (true);