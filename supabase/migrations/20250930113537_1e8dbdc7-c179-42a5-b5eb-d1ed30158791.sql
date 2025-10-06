-- Create teacher records for existing teacher profiles that don't have corresponding teacher records
INSERT INTO public.teachers (profile_id, employee_id, join_date, created_at)
SELECT 
  p.id as profile_id,
  'EMP-' || UPPER(LEFT(MD5(p.id::text), 6)) as employee_id,
  CURRENT_DATE as join_date,
  NOW() as created_at
FROM profiles p
WHERE p.role = 'teacher'::user_role
  AND NOT EXISTS (
    SELECT 1 FROM teachers t WHERE t.profile_id = p.id
  );

-- Add a trigger to automatically create teacher records when a teacher profile is created
CREATE OR REPLACE FUNCTION public.create_teacher_record()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'teacher'::user_role THEN
    INSERT INTO public.teachers (profile_id, employee_id, join_date, created_at)
    VALUES (
      NEW.id,
      'EMP-' || UPPER(LEFT(MD5(NEW.id::text), 6)),
      CURRENT_DATE,
      NOW()
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new teacher profiles
DROP TRIGGER IF EXISTS create_teacher_on_profile ON public.profiles;
CREATE TRIGGER create_teacher_on_profile
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_teacher_record();