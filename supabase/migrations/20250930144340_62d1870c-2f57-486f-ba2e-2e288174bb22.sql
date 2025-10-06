-- Create function to handle profile insertion with parent_user_id
CREATE OR REPLACE FUNCTION public.insert_profile_with_parent(
  p_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_role user_role DEFAULT 'student',
  p_linked_entity_id UUID DEFAULT NULL,
  p_linked_entity_type TEXT DEFAULT NULL,
  p_parent_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    linked_entity_id,
    linked_entity_type,
    parent_user_id
  ) VALUES (
    p_id,
    p_email,
    p_full_name,
    p_phone,
    p_role,
    p_linked_entity_id,
    p_linked_entity_type,
    p_parent_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to update profile with parent_user_id
CREATE OR REPLACE FUNCTION public.update_profile_parent(
  p_profile_id UUID,
  p_parent_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET parent_user_id = p_parent_user_id
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;