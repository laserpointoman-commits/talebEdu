-- First, let's check and update the students table structure to match what the app needs
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS first_name_ar text,
ADD COLUMN IF NOT EXISTS last_name_ar text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS parent_phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS civil_id text,
ADD COLUMN IF NOT EXISTS blood_group text,
ADD COLUMN IF NOT EXISTS allergies text,
ADD COLUMN IF NOT EXISTS medical_conditions text,
ADD COLUMN IF NOT EXISTS medications text,
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS academic_year text,
ADD COLUMN IF NOT EXISTS enrollment_date date,
ADD COLUMN IF NOT EXISTS previous_school text,
ADD COLUMN IF NOT EXISTS parent_name text,
ADD COLUMN IF NOT EXISTS parent_name_ar text,
ADD COLUMN IF NOT EXISTS parent_email text,
ADD COLUMN IF NOT EXISTS parent_occupation text,
ADD COLUMN IF NOT EXISTS relationship text,
ADD COLUMN IF NOT EXISTS transportation_agreement boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS canteen_agreement boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uniform_agreement boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_agreement boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS medical_agreement boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_agreement boolean DEFAULT false;

-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage students" ON students;
DROP POLICY IF EXISTS "Teachers can view students" ON students;
DROP POLICY IF EXISTS "Students can view own profile" ON students;
DROP POLICY IF EXISTS "Parents can view their children" ON students;

-- Create comprehensive RLS policies
CREATE POLICY "Admins can manage students" 
ON students 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Teachers can view students" 
ON students 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'teacher'
  )
);

CREATE POLICY "Students can view own profile" 
ON students 
FOR SELECT 
USING (
  profile_id = auth.uid()
);

CREATE POLICY "Parents can view their children" 
ON students 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE parent_user_id = auth.uid()
  )
);