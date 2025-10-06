-- Fix 1: Drop and recreate the available_contacts view without SECURITY DEFINER
DROP VIEW IF EXISTS public.available_contacts;

CREATE VIEW public.available_contacts AS
SELECT DISTINCT 
    p.id,
    p.full_name,
    p.full_name_ar,
    p.email,
    p.role,
    p.phone,
    s.class AS student_class,
    t.employee_id AS teacher_id
FROM profiles p
LEFT JOIN students s ON s.profile_id = p.id
LEFT JOIN teachers t ON t.profile_id = p.id
WHERE p.id <> auth.uid() 
AND can_message(auth.uid(), p.id);

-- Grant appropriate permissions
GRANT SELECT ON public.available_contacts TO authenticated;

-- Fix 2: Fix infinite recursion in conversation_participants RLS policy
-- First drop the problematic policy
DROP POLICY IF EXISTS "Students can view their conversation participants" ON conversation_participants;

-- Create a security definer function to check conversation access
CREATE OR REPLACE FUNCTION public.user_can_access_conversation(conv_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_student_id uuid;
BEGIN
  -- Get the current user's student ID
  SELECT id INTO current_student_id
  FROM students 
  WHERE profile_id = auth.uid()
  LIMIT 1;
  
  -- If user is not a student, return false
  IF current_student_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the student is a participant in the conversation
  RETURN EXISTS (
    SELECT 1 
    FROM conversation_participants 
    WHERE conversation_id = conv_id 
    AND student_id = current_student_id
  );
END;
$$;

-- Create new RLS policy using the security definer function
CREATE POLICY "Students can view their conversation participants" 
ON conversation_participants 
FOR SELECT 
USING (public.user_can_access_conversation(conversation_id));

-- Fix 3: Add missing unique constraint for teachers table
ALTER TABLE teachers 
ADD CONSTRAINT teachers_profile_id_unique UNIQUE (profile_id);

-- Fix 4: Update functions with proper search_path to address security warnings
-- Update all SECURITY DEFINER functions to have explicit search_path

CREATE OR REPLACE FUNCTION public.calculate_teacher_salary(p_teacher_id uuid, p_period_start date, p_period_end date)
RETURNS TABLE(base_salary numeric, working_days integer, present_days integer, absent_days integer, leave_days integer, total_hours numeric, overtime_hours numeric, deductions numeric, bonuses numeric, net_salary numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Update other security definer functions with search_path
CREATE OR REPLACE FUNCTION public.process_salary_payment(p_payroll_record_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;