-- Ensure teachers table has nfc_id if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teachers' 
    AND column_name = 'nfc_id'
  ) THEN
    -- nfc_id already exists in the teachers table, so we don't need to add it
    NULL;
  END IF;
END $$;

-- Update the create_teacher_record function to generate NFC ID
CREATE OR REPLACE FUNCTION public.create_teacher_record()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'teacher'::user_role THEN
    INSERT INTO public.teachers (profile_id, employee_id, nfc_id, join_date, created_at)
    VALUES (
      NEW.id,
      'EMP-' || UPPER(LEFT(MD5(NEW.id::text), 6)),
      'TCH-' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
      CURRENT_DATE,
      NOW()
    )
    ON CONFLICT (profile_id) DO UPDATE
    SET nfc_id = COALESCE(teachers.nfc_id, EXCLUDED.nfc_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Generate NFC IDs for existing teachers that don't have one
UPDATE public.teachers
SET nfc_id = 'TCH-' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')
WHERE nfc_id IS NULL OR nfc_id = '';

-- Also ensure students have NFC IDs
UPDATE public.students
SET nfc_id = 'STD-' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')
WHERE nfc_id IS NULL OR nfc_id = '';