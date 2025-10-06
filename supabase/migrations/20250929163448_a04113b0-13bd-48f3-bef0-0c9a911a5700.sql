-- Fix the search_path issue for the functions
DROP FUNCTION IF EXISTS public.calculate_total_billing();
DROP FUNCTION IF EXISTS public.create_billing_subscription() CASCADE;

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_total_billing()
RETURNS TABLE (
  total_active_users INTEGER,
  total_amount DECIMAL,
  next_billing_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_active_users,
    SUM(amount) as total_amount,
    MIN(next_billing_date) as next_billing_date
  FROM billing_subscriptions
  WHERE status = 'active';
END;
$$;

-- Recreate trigger function with proper search_path
CREATE OR REPLACE FUNCTION public.create_billing_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate semester dates (assuming 6-month semesters)
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
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_user_created_billing
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_billing_subscription();