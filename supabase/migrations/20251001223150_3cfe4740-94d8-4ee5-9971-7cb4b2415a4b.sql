-- Drop the create_teacher_record trigger if it exists
DROP TRIGGER IF EXISTS create_teacher_record_trigger ON profiles;

-- Make sure the create_teacher_record function doesn't interfere with user creation
CREATE OR REPLACE FUNCTION public.create_teacher_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create teacher record if role is teacher and no record exists
  IF NEW.role = 'teacher'::user_role THEN
    INSERT INTO public.teachers (profile_id, employee_id, nfc_id, join_date)
    VALUES (
      NEW.id,
      'EMP-' || UPPER(LEFT(MD5(NEW.id::text), 6)),
      'TCH-' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
      CURRENT_DATE
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block profile creation if teacher record fails
    RAISE WARNING 'Error creating teacher record: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger  
CREATE TRIGGER create_teacher_record_trigger
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_teacher_record();