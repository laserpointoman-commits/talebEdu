-- Create core finance tables for investor demo
CREATE TABLE public.financial_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('revenue', 'expense', 'asset', 'liability')),
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'OMR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  payment_method TEXT,
  reference_number TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.student_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  due_date DATE NOT NULL,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_id UUID REFERENCES public.student_fees(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  receipt_number TEXT UNIQUE DEFAULT 'RCP-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- Financial accounts policies (admin only)
CREATE POLICY "Admins can manage financial accounts"
ON public.financial_accounts
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Financial transactions policies
CREATE POLICY "Admins can view all transactions"
ON public.financial_transactions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view their own transactions"
ON public.financial_transactions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can create transactions"
ON public.financial_transactions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Student fees policies
CREATE POLICY "Admins can manage all fees"
ON public.student_fees
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Parents can view their children's fees"
ON public.student_fees
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students 
    WHERE parent_id = auth.uid()
  )
);

-- Fee payments policies
CREATE POLICY "Admins can view all payments"
ON public.fee_payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Parents can view their payments"
ON public.fee_payments
FOR SELECT
USING (parent_id = auth.uid());

CREATE POLICY "Parents can make payments"
ON public.fee_payments
FOR INSERT
WITH CHECK (parent_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_user ON public.financial_transactions(user_id);
CREATE INDEX idx_student_fees_student ON public.student_fees(student_id);
CREATE INDEX idx_student_fees_status ON public.student_fees(status);
CREATE INDEX idx_fee_payments_parent ON public.fee_payments(parent_id);

-- Insert demo data for investor presentation
INSERT INTO public.financial_accounts (name, name_ar, account_type, balance) VALUES
  ('Tuition Revenue', 'إيرادات الرسوم الدراسية', 'revenue', 875000),
  ('Transport Revenue', 'إيرادات النقل', 'revenue', 125000),
  ('Canteen Revenue', 'إيرادات المقصف', 'revenue', 45000),
  ('Staff Salaries', 'رواتب الموظفين', 'expense', 450000),
  ('Utilities', 'المرافق', 'expense', 35000),
  ('Maintenance', 'الصيانة', 'expense', 25000),
  ('Cash & Bank', 'النقد والبنك', 'asset', 1500000),
  ('Outstanding Fees', 'الرسوم المستحقة', 'liability', 95000);