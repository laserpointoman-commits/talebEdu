-- Fix security definer functions missing search_path protection
-- This prevents search path manipulation attacks by ensuring functions
-- always use the public schema regardless of the caller's search_path

-- 1. Fix accept_friend_request
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID;
  v_receiver_id UUID;
BEGIN
  SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
  FROM friend_requests
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  UPDATE friend_requests SET status = 'accepted', updated_at = now()
  WHERE id = request_id;
  
  INSERT INTO friendships (student1_id, student2_id)
  VALUES (
    LEAST(v_sender_id, v_receiver_id),
    GREATEST(v_sender_id, v_receiver_id)
  )
  ON CONFLICT (student1_id, student2_id) DO NOTHING;
  
  WITH new_conversation AS (
    INSERT INTO conversations DEFAULT VALUES
    RETURNING id
  )
  INSERT INTO conversation_participants (conversation_id, student_id)
  SELECT new_conversation.id, student_id
  FROM new_conversation, (VALUES (v_sender_id), (v_receiver_id)) AS students(student_id);
  
  RETURN TRUE;
END;
$$;

-- 2. Fix calculate_employee_salary
CREATE OR REPLACE FUNCTION public.calculate_employee_salary(p_employee_id uuid, p_period_start date, p_period_end date)
RETURNS TABLE(base_salary numeric, working_days integer, present_days integer, absent_days integer, leave_days integer, total_hours numeric, overtime_hours numeric, deductions numeric, bonuses numeric, net_salary numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  SELECT base_salary, hourly_rate 
  INTO v_base_salary, v_hourly_rate
  FROM payroll_config
  WHERE employee_id = p_employee_id;

  IF v_base_salary IS NULL THEN
    RAISE EXCEPTION 'No payroll configuration found for employee';
  END IF;

  SELECT COUNT(*)
  INTO v_working_days
  FROM generate_series(p_period_start, p_period_end, '1 day'::interval) d
  WHERE EXTRACT(DOW FROM d) NOT IN (5, 6);

  v_present_days := v_working_days;
  v_absent_days := 0;
  v_leave_days := 0;
  v_total_hours := v_working_days * 8;
  v_overtime_hours := 0;

  v_daily_rate := v_base_salary / v_working_days;
  v_deductions := v_absent_days * v_daily_rate;

  IF v_hourly_rate IS NOT NULL AND v_overtime_hours > 0 THEN
    v_bonuses := v_overtime_hours * v_hourly_rate * 1.5;
  END IF;

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

-- 3. Fix calculate_teacher_salary
CREATE OR REPLACE FUNCTION public.calculate_teacher_salary(p_teacher_id uuid, p_period_start date, p_period_end date)
RETURNS TABLE(base_salary numeric, working_days integer, present_days integer, absent_days integer, leave_days integer, total_hours numeric, overtime_hours numeric, deductions numeric, bonuses numeric, net_salary numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  SELECT base_salary, hourly_rate 
  INTO v_base_salary, v_hourly_rate
  FROM payroll_config
  WHERE teacher_id = p_teacher_id;

  IF v_base_salary IS NULL THEN
    RAISE EXCEPTION 'No payroll configuration found for teacher';
  END IF;

  SELECT COUNT(*)
  INTO v_working_days
  FROM generate_series(p_period_start, p_period_end, '1 day'::interval) d
  WHERE EXTRACT(DOW FROM d) NOT IN (5, 6);

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

  v_daily_rate := v_base_salary / v_working_days;
  v_deductions := v_absent_days * v_daily_rate;

  IF v_hourly_rate IS NOT NULL AND v_overtime_hours > 0 THEN
    v_bonuses := v_overtime_hours * v_hourly_rate * 1.5;
  END IF;

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

-- 4. Fix calculate_total_billing
CREATE OR REPLACE FUNCTION public.calculate_total_billing()
RETURNS TABLE(total_active_users integer, total_amount numeric, next_billing_date date)
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

-- 5. Fix can_message
CREATE OR REPLACE FUNCTION public.can_message(sender_id uuid, recipient_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_role user_role;
  recipient_role user_role;
  has_common_class BOOLEAN;
BEGIN
  SELECT role INTO sender_role FROM profiles WHERE id = sender_id;
  SELECT role INTO recipient_role FROM profiles WHERE id = recipient_id;
  
  IF sender_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  IF sender_role = 'teacher' THEN
    IF recipient_role = 'student' THEN
      SELECT EXISTS(
        SELECT 1 
        FROM teacher_classes tc
        JOIN teachers t ON t.id = tc.teacher_id
        JOIN students s ON s.class::uuid = tc.class_id
        WHERE t.profile_id = sender_id 
        AND s.profile_id = recipient_id
      ) INTO has_common_class;
      
      RETURN has_common_class;
    END IF;
    
    IF recipient_role IN ('teacher', 'admin', 'finance') THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  IF sender_role = 'parent' THEN
    IF recipient_role = 'admin' THEN
      RETURN TRUE;
    END IF;
    
    IF recipient_role = 'teacher' THEN
      SELECT EXISTS(
        SELECT 1 
        FROM students s
        JOIN teacher_classes tc ON tc.class_id::text = s.class
        JOIN teachers t ON t.id = tc.teacher_id
        WHERE s.parent_id = sender_id 
        AND t.profile_id = recipient_id
      ) INTO has_common_class;
      
      RETURN has_common_class;
    END IF;
  END IF;
  
  IF sender_role = 'student' AND recipient_role = 'student' THEN
    SELECT EXISTS(
      SELECT 1 
      FROM students s1, students s2
      WHERE s1.profile_id = sender_id 
      AND s2.profile_id = recipient_id
      AND s1.class = s2.class
    ) INTO has_common_class;
    
    RETURN has_common_class;
  END IF;
  
  IF sender_role = 'finance' THEN
    IF recipient_role IN ('admin', 'teacher') THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  IF sender_role = 'driver' THEN
    IF recipient_role = 'admin' THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 6. Fix create_auth_user
CREATE OR REPLACE FUNCTION public.create_auth_user(p_email text, p_password text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := gen_random_uuid();
  
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
    extensions.crypt(p_password, extensions.gen_salt('bf')),
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

-- 7. Fix create_billing_subscription
CREATE OR REPLACE FUNCTION public.create_billing_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- 8. Fix create_teacher_record
CREATE OR REPLACE FUNCTION public.create_teacher_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'teacher'::user_role THEN
    INSERT INTO public.teachers (profile_id, employee_id, nfc_id, join_date)
    VALUES (
      NEW.id,
      'EMP-' || UPPER(LEFT(MD5(NEW.id::text), 6)),
      'TCH-' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
      CURRENT_DATE
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating teacher record: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 9. Fix get_or_create_conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_student_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_current_student_id UUID;
BEGIN
  SELECT id INTO v_current_student_id
  FROM students WHERE profile_id = auth.uid();
  
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.student_id = v_current_student_id
    AND cp2.student_id = other_student_id
    AND cp1.conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      GROUP BY conversation_id 
      HAVING COUNT(*) = 2
    )
  LIMIT 1;
  
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations DEFAULT VALUES
    RETURNING id INTO v_conversation_id;
    
    INSERT INTO conversation_participants (conversation_id, student_id)
    VALUES 
      (v_conversation_id, v_current_student_id),
      (v_conversation_id, other_student_id);
  END IF;
  
  RETURN v_conversation_id;
END;
$$;

-- 10. Fix get_user_role (already has search_path from previous migration, but recreating for consistency)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role::text INTO user_role
    FROM profiles
    WHERE id = user_id;
    
    RETURN user_role;
END;
$$;

-- 11. Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 12. Fix has_any_role (already has search_path from previous migration, but recreating for consistency)
CREATE OR REPLACE FUNCTION public.has_any_role(user_id uuid, required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role::text INTO user_role
    FROM profiles
    WHERE id = user_id;
    
    RETURN user_role = ANY(required_roles);
END;
$$;

-- 13. Fix has_role (already has search_path from previous migration, but recreating for consistency)
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role::text INTO user_role
    FROM profiles
    WHERE id = user_id;
    
    RETURN user_role = required_role;
END;
$$;

-- 14. Fix initialize_user_notifications
CREATE OR REPLACE FUNCTION public.initialize_user_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification notification_type;
  notifications notification_type[];
BEGIN
  CASE NEW.role
    WHEN 'student' THEN
      notifications := ARRAY[
        'system_announcements',
        'grade_updates', 
        'homework_assigned',
        'exam_schedule',
        'attendance_alerts',
        'bus_arrival',
        'canteen_orders',
        'wallet_transactions'
      ]::notification_type[];
    WHEN 'parent' THEN
      notifications := ARRAY[
        'system_announcements',
        'child_attendance',
        'child_grades',
        'child_homework',
        'child_bus_location',
        'payment_reminders',
        'school_announcements'
      ]::notification_type[];
    WHEN 'teacher' THEN
      notifications := ARRAY[
        'system_announcements',
        'class_assignments',
        'student_submissions',
        'parent_messages',
        'schedule_changes',
        'leave_approvals',
        'payroll_updates'
      ]::notification_type[];
    WHEN 'admin' THEN
      notifications := ARRAY[
        'system_announcements',
        'user_registrations',
        'system_errors',
        'payment_received',
        'leave_requests',
        'bus_issues',
        'security_alerts'
      ]::notification_type[];
    WHEN 'driver' THEN
      notifications := ARRAY[
        'system_announcements',
        'route_changes',
        'student_pickup',
        'emergency_alerts',
        'vehicle_maintenance'
      ]::notification_type[];
    ELSE
      notifications := ARRAY['system_announcements']::notification_type[];
  END CASE;
  
  FOREACH notification IN ARRAY notifications
  LOOP
    INSERT INTO notification_preferences (user_id, notification_type, enabled, email_enabled, push_enabled, sms_enabled)
    VALUES (NEW.id, notification, true, true, true, false)
    ON CONFLICT (user_id, notification_type) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- 15. Fix initialize_user_wallet
CREATE OR REPLACE FUNCTION public.initialize_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO wallet_balances (user_id, balance, currency)
  VALUES (NEW.id, 0, 'OMR')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 16. Fix insert_profile_with_parent
CREATE OR REPLACE FUNCTION public.insert_profile_with_parent(p_id uuid, p_email text, p_full_name text, p_phone text DEFAULT NULL::text, p_role user_role DEFAULT 'student'::user_role, p_linked_entity_id uuid DEFAULT NULL::uuid, p_linked_entity_type text DEFAULT NULL::text, p_parent_user_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 17. Fix is_test_account
CREATE OR REPLACE FUNCTION public.is_test_account(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM test_accounts WHERE email = user_email
  );
END;
$$;

-- 18. Fix process_fee_payment
CREATE OR REPLACE FUNCTION public.process_fee_payment(p_fee_id uuid, p_amount numeric, p_payment_method text, p_transaction_reference text DEFAULT NULL::text)
RETURNS payment_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment payment_transactions;
  v_fee student_fees;
  v_parent_id UUID;
BEGIN
  SELECT * INTO v_fee FROM student_fees WHERE id = p_fee_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fee not found';
  END IF;
  
  SELECT parent_id INTO v_parent_id 
  FROM students 
  WHERE id = v_fee.student_id;
  
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
  
  UPDATE student_fees 
  SET paid_amount = paid_amount + p_amount
  WHERE id = p_fee_id;
  
  RETURN v_payment;
END;
$$;

-- 19. Fix process_fee_payment_from_wallet
CREATE OR REPLACE FUNCTION public.process_fee_payment_from_wallet(p_fee_id uuid, p_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee student_fees;
  v_parent_id UUID;
  v_wallet_balance NUMERIC;
  v_payment_id UUID;
  v_transaction_id UUID;
BEGIN
  SELECT * INTO v_fee FROM student_fees WHERE id = p_fee_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Fee not found');
  END IF;
  
  SELECT parent_id INTO v_parent_id 
  FROM students 
  WHERE id = v_fee.student_id;
  
  IF v_parent_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;
  
  SELECT balance INTO v_wallet_balance
  FROM wallet_balances
  WHERE user_id = v_parent_id;
  
  IF v_wallet_balance IS NULL OR v_wallet_balance < p_amount THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Insufficient wallet balance',
      'current_balance', COALESCE(v_wallet_balance, 0),
      'required_amount', p_amount
    );
  END IF;
  
  UPDATE wallet_balances
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = v_parent_id;
  
  INSERT INTO payment_transactions (
    fee_id,
    parent_id,
    amount,
    payment_method,
    receipt_number,
    created_by
  ) VALUES (
    p_fee_id,
    v_parent_id,
    p_amount,
    'wallet',
    'RCP-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
    v_parent_id
  ) RETURNING id INTO v_payment_id;
  
  UPDATE student_fees 
  SET paid_amount = paid_amount + p_amount,
      updated_at = now()
  WHERE id = p_fee_id;
  
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    description_ar,
    reference_id,
    reference_type
  ) VALUES (
    v_parent_id,
    'payment',
    p_amount,
    v_wallet_balance - p_amount,
    'School fee payment',
    'دفع رسوم مدرسية',
    v_payment_id,
    'fee_payment'
  ) RETURNING id INTO v_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Payment successful',
    'payment_id', v_payment_id,
    'transaction_id', v_transaction_id,
    'remaining_balance', v_wallet_balance - p_amount
  );
END;
$$;

-- 20. Fix process_salary_payment
CREATE OR REPLACE FUNCTION public.process_salary_payment(p_payroll_record_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id UUID;
  v_teacher_profile_id UUID;
  v_amount NUMERIC;
  v_admin_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  SELECT teacher_id, net_salary
  INTO v_teacher_id, v_amount
  FROM payroll_records
  WHERE id = p_payroll_record_id
    AND payment_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payroll record not found or already processed';
  END IF;

  SELECT profile_id
  INTO v_teacher_profile_id
  FROM teachers
  WHERE id = v_teacher_id;

  SELECT balance
  INTO v_admin_balance
  FROM admin_wallets
  LIMIT 1;

  IF v_admin_balance IS NULL OR v_admin_balance < v_amount THEN
    RAISE EXCEPTION 'Insufficient admin wallet balance';
  END IF;

  UPDATE admin_wallets
  SET balance = balance - v_amount,
      updated_at = now();

  INSERT INTO wallet_balances (user_id, balance)
  VALUES (v_teacher_profile_id, 0)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = wallet_balances.balance + v_amount,
    updated_at = now();

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

  UPDATE payroll_records
  SET payment_status = 'paid',
      payment_date = now(),
      transaction_id = v_transaction_id,
      updated_at = now()
  WHERE id = p_payroll_record_id;

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

-- 21. Fix process_wallet_transfer
CREATE OR REPLACE FUNCTION public.process_wallet_transfer(p_to_user_id uuid, p_amount numeric, p_notes text DEFAULT NULL::text)
RETURNS wallet_transfers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_user_id UUID;
  v_from_balance NUMERIC;
  v_transfer_record wallet_transfers;
  v_to_balance_after NUMERIC;
  v_from_balance_after NUMERIC;
BEGIN
  v_from_user_id := auth.uid();
  
  IF v_from_user_id = p_to_user_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same wallet';
  END IF;
  
  SELECT balance INTO v_from_balance
  FROM wallet_balances
  WHERE user_id = v_from_user_id
  FOR UPDATE;
  
  IF v_from_balance IS NULL THEN
    INSERT INTO wallet_balances (user_id, balance)
    VALUES (v_from_user_id, 0);
    v_from_balance := 0;
  END IF;
  
  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %, Required: %', v_from_balance, p_amount;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_to_user_id) THEN
    RAISE EXCEPTION 'Recipient user not found';
  END IF;
  
  INSERT INTO wallet_balances (user_id, balance)
  VALUES (p_to_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  UPDATE wallet_balances
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = v_from_user_id
  RETURNING balance INTO v_from_balance_after;
  
  UPDATE wallet_balances
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_to_user_id
  RETURNING balance INTO v_to_balance_after;
  
  INSERT INTO wallet_transfers (
    from_user_id,
    to_user_id,
    amount,
    notes,
    status,
    completed_at
  ) VALUES (
    v_from_user_id,
    p_to_user_id,
    p_amount,
    p_notes,
    'completed',
    now()
  ) RETURNING * INTO v_transfer_record;
  
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    description_ar,
    reference_id,
    reference_type
  ) VALUES (
    v_from_user_id,
    'transfer_out',
    p_amount,
    v_from_balance_after,
    'Transfer to user',
    'تحويل إلى مستخدم',
    v_transfer_record.id,
    'wallet_transfer'
  );
  
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    description_ar,
    reference_id,
    reference_type
  ) VALUES (
    p_to_user_id,
    'transfer_in',
    p_amount,
    v_to_balance_after,
    'Transfer from user',
    'تحويل من مستخدم',
    v_transfer_record.id,
    'wallet_transfer'
  );
  
  RETURN v_transfer_record;
END;
$$;

-- 22. Fix reset_test_account_data
CREATE OR REPLACE FUNCTION public.reset_test_account_data(test_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_student_id UUID;
BEGIN
  DELETE FROM direct_messages WHERE sender_id = test_user_id;
  DELETE FROM message_attachments WHERE message_id NOT IN (SELECT id FROM direct_messages);
  DELETE FROM financial_transactions WHERE user_id = test_user_id;
  DELETE FROM wallet_transactions WHERE user_id = test_user_id;
  UPDATE wallet_balances SET balance = 0 WHERE user_id = test_user_id;
  DELETE FROM orders WHERE user_id = test_user_id;
  DELETE FROM meal_orders WHERE parent_id = test_user_id;
  DELETE FROM fee_payments WHERE parent_id = test_user_id;
  DELETE FROM notification_history WHERE user_id = test_user_id;
  
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id AND role = 'student') THEN
    SELECT id INTO test_student_id FROM students WHERE profile_id = test_user_id;
    
    IF test_student_id IS NOT NULL THEN
      DELETE FROM grades WHERE student_id = test_student_id;
      DELETE FROM homework_submissions WHERE student_id = test_student_id;
      DELETE FROM attendance_records WHERE student_id = test_student_id;
      DELETE FROM checkpoint_logs WHERE student_id = test_student_id;
      DELETE FROM meal_orders WHERE student_id = test_student_id;
      DELETE FROM parental_controls WHERE student_id = test_student_id;
      DELETE FROM friend_requests WHERE sender_id = test_student_id OR receiver_id = test_student_id;
      DELETE FROM friendships WHERE student1_id = test_student_id OR student2_id = test_student_id;
      DELETE FROM chat_messages WHERE sender_id = test_student_id;
      DELETE FROM conversation_participants WHERE student_id = test_student_id;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id AND role = 'teacher') THEN
    DELETE FROM leave_requests WHERE teacher_id IN (SELECT id FROM teachers WHERE profile_id = test_user_id);
    DELETE FROM teacher_attendance WHERE teacher_id IN (SELECT id FROM teachers WHERE profile_id = test_user_id);
    DELETE FROM payroll_records WHERE teacher_id IN (SELECT id FROM teachers WHERE profile_id = test_user_id);
  END IF;
END;
$$;

-- 23. Fix update_profile_parent
CREATE OR REPLACE FUNCTION public.update_profile_parent(p_profile_id uuid, p_parent_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET parent_user_id = p_parent_user_id
  WHERE id = p_profile_id;
END;
$$;

-- 24. Fix user_can_access_conversation
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
  SELECT id INTO current_student_id
  FROM students 
  WHERE profile_id = auth.uid()
  LIMIT 1;
  
  IF current_student_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 
    FROM conversation_participants 
    WHERE conversation_id = conv_id 
    AND student_id = current_student_id
  );
END;
$$;