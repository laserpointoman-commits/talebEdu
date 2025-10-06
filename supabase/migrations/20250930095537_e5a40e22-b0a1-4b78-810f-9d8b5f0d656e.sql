-- Create admin wallet table
CREATE TABLE public.admin_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  balance NUMERIC(10,3) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'OMR',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll configuration table
CREATE TABLE public.payroll_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  base_salary NUMERIC(10,3) NOT NULL,
  hourly_rate NUMERIC(10,3),
  payment_frequency TEXT NOT NULL DEFAULT 'monthly', -- monthly, bi-weekly, weekly
  bank_account TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id)
);

-- Create teacher attendance table
CREATE TABLE public.teacher_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL, -- present, absent, late, half-day, vacation, sick-leave
  total_hours NUMERIC(5,2),
  location TEXT,
  check_in_method TEXT, -- nfc, manual, mobile
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, date)
);

-- Create leave requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL, -- vacation, sick, personal, maternity, emergency
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll records table
CREATE TABLE public.payroll_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary NUMERIC(10,3) NOT NULL,
  working_days INTEGER NOT NULL DEFAULT 0,
  present_days INTEGER NOT NULL DEFAULT 0,
  absent_days INTEGER NOT NULL DEFAULT 0,
  leave_days INTEGER NOT NULL DEFAULT 0,
  total_hours NUMERIC(7,2),
  overtime_hours NUMERIC(5,2),
  deductions NUMERIC(10,3) DEFAULT 0,
  bonuses NUMERIC(10,3) DEFAULT 0,
  net_salary NUMERIC(10,3) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT, -- wallet, bank_transfer, cash
  transaction_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll transactions table
CREATE TABLE public.payroll_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
  from_wallet_type TEXT NOT NULL, -- admin, teacher
  to_wallet_id UUID NOT NULL,
  amount NUMERIC(10,3) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'OMR',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for salary transfers
CREATE TABLE public.payroll_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- salary_received, leave_approved, attendance_reminder
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.admin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_wallets
CREATE POLICY "Only admins can view admin wallet"
  ON public.admin_wallets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Only admins can manage admin wallet"
  ON public.admin_wallets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- RLS Policies for payroll_config
CREATE POLICY "Admins can manage payroll config"
  ON public.payroll_config FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Teachers can view own payroll config"
  ON public.payroll_config FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for teacher_attendance
CREATE POLICY "Admins can manage all attendance"
  ON public.teacher_attendance FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Teachers can view own attendance"
  ON public.teacher_attendance FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can check in/out"
  ON public.teacher_attendance FOR INSERT
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update own attendance"
  ON public.teacher_attendance FOR UPDATE
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for leave_requests
CREATE POLICY "Admins can manage all leave requests"
  ON public.leave_requests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Teachers can manage own leave requests"
  ON public.leave_requests FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for payroll_records
CREATE POLICY "Admins can manage all payroll records"
  ON public.payroll_records FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Teachers can view own payroll records"
  ON public.payroll_records FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for payroll_transactions
CREATE POLICY "Admins can manage all transactions"
  ON public.payroll_transactions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Teachers can view own transactions"
  ON public.payroll_transactions FOR SELECT
  USING (
    to_wallet_id IN (
      SELECT user_id FROM wallet_balances wb
      JOIN teachers t ON wb.user_id = t.profile_id
      WHERE t.profile_id = auth.uid()
    )
  );

-- RLS Policies for payroll_notifications
CREATE POLICY "Users can view own notifications"
  ON public.payroll_notifications FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notifications"
  ON public.payroll_notifications FOR UPDATE
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "System can create notifications"
  ON public.payroll_notifications FOR INSERT
  WITH CHECK (true);

-- Create function to calculate salary
CREATE OR REPLACE FUNCTION public.calculate_teacher_salary(
  p_teacher_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS TABLE (
  base_salary NUMERIC,
  working_days INTEGER,
  present_days INTEGER,
  absent_days INTEGER,
  leave_days INTEGER,
  total_hours NUMERIC,
  overtime_hours NUMERIC,
  deductions NUMERIC,
  bonuses NUMERIC,
  net_salary NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_salary NUMERIC;
  v_hourly_rate NUMERIC;
  v_working_days INTEGER;
  v_present_days INTEGER;
  v_absent_days INTEGER;
  v_leave_days INTEGER;
  v_total_hours NUMERIC;
  v_overtime_hours NUMERIC;
  v_daily_rate NUMERIC;
  v_deductions NUMERIC := 0;
  v_bonuses NUMERIC := 0;
  v_net_salary NUMERIC;
BEGIN
  -- Get teacher's payroll config
  SELECT base_salary, hourly_rate 
  INTO v_base_salary, v_hourly_rate
  FROM payroll_config
  WHERE teacher_id = p_teacher_id;

  IF v_base_salary IS NULL THEN
    RAISE EXCEPTION 'No payroll configuration found for teacher';
  END IF;

  -- Calculate working days (excluding weekends)
  SELECT COUNT(*)
  INTO v_working_days
  FROM generate_series(p_period_start, p_period_end, '1 day'::interval) d
  WHERE EXTRACT(DOW FROM d) NOT IN (5, 6); -- Friday and Saturday

  -- Count attendance
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('present', 'late', 'half-day')),
    COUNT(*) FILTER (WHERE status = 'absent'),
    COUNT(*) FILTER (WHERE status IN ('vacation', 'sick-leave')),
    COALESCE(SUM(total_hours), 0),
    COALESCE(SUM(GREATEST(total_hours - 8, 0)), 0)
  INTO v_present_days, v_absent_days, v_leave_days, v_total_hours, v_overtime_hours
  FROM teacher_attendance
  WHERE teacher_id = p_teacher_id
    AND date BETWEEN p_period_start AND p_period_end;

  -- Calculate daily rate
  v_daily_rate := v_base_salary / v_working_days;

  -- Calculate deductions for absences
  v_deductions := v_absent_days * v_daily_rate;

  -- Add overtime pay if hourly rate is configured
  IF v_hourly_rate IS NOT NULL AND v_overtime_hours > 0 THEN
    v_bonuses := v_overtime_hours * v_hourly_rate * 1.5; -- 1.5x for overtime
  END IF;

  -- Calculate net salary
  v_net_salary := v_base_salary - v_deductions + v_bonuses;

  RETURN QUERY SELECT 
    v_base_salary,
    v_working_days,
    v_present_days,
    v_absent_days,
    v_leave_days,
    v_total_hours,
    v_overtime_hours,
    v_deductions,
    v_bonuses,
    v_net_salary;
END;
$$;

-- Create function to process salary payment
CREATE OR REPLACE FUNCTION public.process_salary_payment(
  p_payroll_record_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_teacher_id UUID;
  v_teacher_profile_id UUID;
  v_amount NUMERIC;
  v_admin_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Get payroll record details
  SELECT teacher_id, net_salary
  INTO v_teacher_id, v_amount
  FROM payroll_records
  WHERE id = p_payroll_record_id
    AND payment_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payroll record not found or already processed';
  END IF;

  -- Get teacher's profile ID
  SELECT profile_id
  INTO v_teacher_profile_id
  FROM teachers
  WHERE id = v_teacher_id;

  -- Check admin wallet balance
  SELECT balance
  INTO v_admin_balance
  FROM admin_wallets
  LIMIT 1;

  IF v_admin_balance IS NULL OR v_admin_balance < v_amount THEN
    RAISE EXCEPTION 'Insufficient admin wallet balance';
  END IF;

  -- Start transaction
  -- Deduct from admin wallet
  UPDATE admin_wallets
  SET balance = balance - v_amount,
      updated_at = now();

  -- Add to teacher wallet
  INSERT INTO wallet_balances (user_id, balance)
  VALUES (v_teacher_profile_id, 0)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = wallet_balances.balance + v_amount,
    updated_at = now();

  -- Create transaction record
  INSERT INTO payroll_transactions (
    payroll_record_id,
    from_wallet_type,
    to_wallet_id,
    amount,
    status,
    processed_at
  ) VALUES (
    p_payroll_record_id,
    'admin',
    v_teacher_profile_id,
    v_amount,
    'completed',
    now()
  ) RETURNING id INTO v_transaction_id;

  -- Update payroll record
  UPDATE payroll_records
  SET payment_status = 'paid',
      payment_date = now(),
      transaction_id = v_transaction_id,
      updated_at = now()
  WHERE id = p_payroll_record_id;

  -- Create wallet transaction for teacher
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    description_ar
  ) 
  SELECT 
    v_teacher_profile_id,
    'deposit',
    v_amount,
    (SELECT balance FROM wallet_balances WHERE user_id = v_teacher_profile_id),
    'Salary payment for ' || to_char(period_start, 'Month YYYY'),
    'راتب شهر ' || to_char(period_start, 'Month YYYY')
  FROM payroll_records
  WHERE id = p_payroll_record_id;

  -- Create notification
  INSERT INTO payroll_notifications (
    teacher_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    v_teacher_id,
    'salary_received',
    'Salary Credited',
    'Your salary of ' || v_amount || ' OMR has been credited to your wallet',
    jsonb_build_object(
      'amount', v_amount,
      'payroll_record_id', p_payroll_record_id,
      'transaction_id', v_transaction_id
    )
  );

  RETURN TRUE;
END;
$$;

-- Initialize admin wallet if not exists
INSERT INTO admin_wallets (balance)
VALUES (50000) -- Starting balance
ON CONFLICT DO NOTHING;

-- Add trigger to update timestamps
CREATE TRIGGER update_payroll_config_updated_at
  BEFORE UPDATE ON public.payroll_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_attendance_updated_at
  BEFORE UPDATE ON public.teacher_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
  BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();