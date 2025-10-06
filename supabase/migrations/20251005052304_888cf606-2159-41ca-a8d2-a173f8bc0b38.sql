-- Drop the old function
DROP FUNCTION IF EXISTS create_auth_user(TEXT, TEXT, JSONB);

-- Create a simpler function that works with Supabase's setup
CREATE OR REPLACE FUNCTION create_auth_user(
  p_email TEXT,
  p_password TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Generate a new UUID for the user
  v_user_id := gen_random_uuid();
  
  -- Use Supabase's extensions.crypt function with proper salt
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    aud,
    role
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    p_metadata,
    now(),
    now(),
    '',
    '',
    'authenticated',
    'authenticated'
  );
  
  RETURN v_user_id;
END;
$$;