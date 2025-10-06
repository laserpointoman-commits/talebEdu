-- Delete the corrupted teacher account and profile if they exist
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find the teacher user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'teacher@talebschool.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Delete from profiles first (due to foreign key)
    DELETE FROM public.profiles WHERE id = v_user_id;
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;
END $$;