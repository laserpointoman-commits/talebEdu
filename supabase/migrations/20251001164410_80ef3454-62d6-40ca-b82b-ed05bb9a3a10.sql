-- Update RLS policies for financial_accounts table
DROP POLICY IF EXISTS "Admins can manage financial accounts" ON public.financial_accounts;

CREATE POLICY "Finance and admin roles can manage financial accounts" 
ON public.financial_accounts 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'finance')
));

-- Update RLS policies for financial_transactions table
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Admins can create transactions" ON public.financial_transactions;

CREATE POLICY "Finance and admin roles can view all transactions" 
ON public.financial_transactions 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'finance')
));

CREATE POLICY "Finance and admin roles can create transactions" 
ON public.financial_transactions 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'finance')
));

-- Update RLS policies for student_fees table (if exists)
DROP POLICY IF EXISTS "Admins can manage student fees" ON public.student_fees;

CREATE POLICY "Finance and admin roles can manage student fees" 
ON public.student_fees 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'finance')
));

-- Update RLS policies for fee_payments table
DROP POLICY IF EXISTS "Admins can view all payments" ON public.fee_payments;

CREATE POLICY "Finance and admin roles can view all payments" 
ON public.fee_payments 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'finance')
));