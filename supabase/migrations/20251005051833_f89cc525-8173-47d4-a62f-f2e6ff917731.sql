-- Create a function to create auth users that bypasses the email_change scan issue
-- This function directly inserts into auth.users
CREATE OR REPLACE FUNCTION create_auth_user(
  p_email TEXT,
  p_password TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Generate a new UUID for the user
  v_user_id := gen_random_uuid();
  
  -- Hash the password using Supabase's crypt function
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  
  -- Insert into auth.users table directly
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
    v_encrypted_password,
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