-- Update the billing subscription trigger to only create subscriptions for students (not parents)
CREATE OR REPLACE FUNCTION public.create_billing_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create billing subscription for student role, not for parents
  IF NEW.role = 'student' AND NEW.parent_user_id IS NULL THEN
    INSERT INTO public.billing_subscriptions (
      user_id,
      semester_start,
      semester_end,
      next_billing_date
    ) VALUES (
      NEW.id,
      DATE_TRUNC('month', NOW()),
      DATE_TRUNC('month', NOW()) + INTERVAL '6 months',
      DATE_TRUNC('month', NOW()) + INTERVAL '6 months'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- Create new trigger for billing subscription
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_billing_subscription();