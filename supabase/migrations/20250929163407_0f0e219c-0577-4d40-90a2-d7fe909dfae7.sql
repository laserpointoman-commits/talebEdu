-- Create user_role_assignments table for multiple roles per user
CREATE TABLE public.user_role_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for user_role_assignments
CREATE POLICY "Admins can manage role assignments" 
ON public.user_role_assignments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can view their own roles" 
ON public.user_role_assignments 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create billing_subscriptions table
CREATE TABLE public.billing_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  currency TEXT NOT NULL DEFAULT 'OMR',
  semester_start DATE NOT NULL,
  semester_end DATE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  next_billing_date DATE
);

-- Enable RLS
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for billing_subscriptions
CREATE POLICY "Admins can manage subscriptions" 
ON public.billing_subscriptions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can view their own subscription" 
ON public.billing_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create billing_history table
CREATE TABLE public.billing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'OMR',
  description TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded'))
);

-- Enable RLS
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- Create policies for billing_history
CREATE POLICY "Admins can manage billing history" 
ON public.billing_history 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can view their own billing history" 
ON public.billing_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add linked_entity_id and linked_entity_type to profiles to link with existing entities
ALTER TABLE public.profiles 
ADD COLUMN linked_entity_id UUID,
ADD COLUMN linked_entity_type TEXT CHECK (linked_entity_type IN ('student', 'teacher', 'driver'));

-- Create function to calculate total billing
CREATE OR REPLACE FUNCTION public.calculate_total_billing()
RETURNS TABLE (
  total_active_users INTEGER,
  total_amount DECIMAL,
  next_billing_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to update billing subscription on user creation
CREATE OR REPLACE FUNCTION public.create_billing_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Trigger to create billing subscription when a new user is created
CREATE TRIGGER on_user_created_billing
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_billing_subscription();