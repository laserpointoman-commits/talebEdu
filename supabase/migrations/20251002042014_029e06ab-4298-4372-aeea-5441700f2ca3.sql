-- Create student fees table for managing tuition and other fees
CREATE TABLE IF NOT EXISTS public.student_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  fee_type TEXT NOT NULL, -- 'tuition', 'transport', 'activities', 'books', 'uniform', 'other'
  total_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create fee structure table for defining standard fees
CREATE TABLE IF NOT EXISTS public.fee_structure (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year TEXT NOT NULL,
  grade TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_frequency TEXT DEFAULT 'term', -- 'term', 'monthly', 'yearly'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(academic_year, grade, fee_type)
);

-- Create payment transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_id UUID REFERENCES student_fees(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES profiles(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'bank_transfer', 'wallet'
  transaction_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  receipt_number TEXT UNIQUE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create installment plans table
CREATE TABLE IF NOT EXISTS public.installment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_id UUID REFERENCES student_fees(id) ON DELETE CASCADE,
  total_installments INTEGER NOT NULL,
  installment_amount NUMERIC(10,2) NOT NULL,
  frequency TEXT DEFAULT 'monthly', -- 'weekly', 'monthly', 'quarterly'
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create installment schedule
CREATE TABLE IF NOT EXISTS public.installment_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES installment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'partial'
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_fees
CREATE POLICY "Finance and admin can manage all fees"
  ON public.student_fees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Parents can view their children fees"
  ON public.student_fees
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students 
      WHERE parent_id = auth.uid()
    )
  );

-- RLS Policies for fee_structure
CREATE POLICY "Everyone can view fee structure"
  ON public.fee_structure
  FOR SELECT
  USING (true);

CREATE POLICY "Finance and admin can manage fee structure"
  ON public.fee_structure
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  );

-- RLS Policies for payment_transactions
CREATE POLICY "Finance and admin can manage all transactions"
  ON public.payment_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Parents can view their payments"
  ON public.payment_transactions
  FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can make payments"
  ON public.payment_transactions
  FOR INSERT
  WITH CHECK (parent_id = auth.uid());

-- RLS Policies for installment_plans
CREATE POLICY "Finance and admin can manage installment plans"
  ON public.installment_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Parents can view their installment plans"
  ON public.installment_plans
  FOR SELECT
  USING (
    fee_id IN (
      SELECT sf.id FROM student_fees sf
      JOIN students s ON s.id = sf.student_id
      WHERE s.parent_id = auth.uid()
    )
  );

-- RLS Policies for installment_schedule
CREATE POLICY "Finance and admin can manage installment schedule"
  ON public.installment_schedule
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Parents can view their installment schedule"
  ON public.installment_schedule
  FOR SELECT
  USING (
    plan_id IN (
      SELECT ip.id FROM installment_plans ip
      JOIN student_fees sf ON sf.id = ip.fee_id
      JOIN students s ON s.id = sf.student_id
      WHERE s.parent_id = auth.uid()
    )
  );

-- Create function to update fee status
CREATE OR REPLACE FUNCTION update_fee_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount >= NEW.total_amount THEN
    NEW.status := 'paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status := 'partial';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.paid_amount = 0 THEN
    NEW.status := 'overdue';
  ELSE
    NEW.status := 'pending';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating fee status
CREATE TRIGGER update_student_fee_status
  BEFORE UPDATE ON public.student_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_fee_status();

-- Create function to process fee payment
CREATE OR REPLACE FUNCTION process_fee_payment(
  p_fee_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_transaction_reference TEXT DEFAULT NULL
)
RETURNS payment_transactions AS $$
DECLARE
  v_payment payment_transactions;
  v_fee student_fees;
  v_parent_id UUID;
BEGIN
  -- Get fee details
  SELECT * INTO v_fee FROM student_fees WHERE id = p_fee_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fee not found';
  END IF;
  
  -- Get parent ID
  SELECT parent_id INTO v_parent_id 
  FROM students 
  WHERE id = v_fee.student_id;
  
  -- Create payment transaction
  INSERT INTO payment_transactions (
    fee_id,
    parent_id,
    amount,
    payment_method,
    transaction_reference,
    receipt_number,
    created_by
  ) VALUES (
    p_fee_id,
    v_parent_id,
    p_amount,
    p_payment_method,
    p_transaction_reference,
    'RCP-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
    auth.uid()
  ) RETURNING * INTO v_payment;
  
  -- Update fee paid amount
  UPDATE student_fees 
  SET paid_amount = paid_amount + p_amount
  WHERE id = p_fee_id;
  
  RETURN v_payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample fee structure
INSERT INTO fee_structure (academic_year, grade, fee_type, amount, payment_frequency, description)
VALUES 
  ('2023-2024', 'Grade 1', 'tuition', 2500, 'term', 'Tuition fees for Grade 1'),
  ('2023-2024', 'Grade 1', 'transport', 150, 'monthly', 'School bus transportation'),
  ('2023-2024', 'Grade 1', 'activities', 100, 'term', 'Extra-curricular activities'),
  ('2023-2024', 'Grade 2', 'tuition', 2700, 'term', 'Tuition fees for Grade 2'),
  ('2023-2024', 'Grade 2', 'transport', 150, 'monthly', 'School bus transportation'),
  ('2023-2024', 'Grade 2', 'activities', 120, 'term', 'Extra-curricular activities')
ON CONFLICT DO NOTHING;