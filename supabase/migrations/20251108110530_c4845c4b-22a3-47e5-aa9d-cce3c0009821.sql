-- Fix Function Search Path Mutable warning
-- Add SET search_path = public to 7 functions that are missing it

-- 1. Fix generate_transaction_number
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_sequence INTEGER;
    v_month TEXT;
    v_year TEXT;
    v_transaction_number TEXT;
BEGIN
    v_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(transaction_number, '-', 1) AS INTEGER)
    ), 0) + 1
    INTO v_sequence
    FROM financial_transactions
    WHERE transaction_number LIKE '____-' || v_month || '-' || v_year;
    
    v_transaction_number := LPAD(v_sequence::TEXT, 4, '0') || '-' || v_month || '-' || v_year;
    
    RETURN v_transaction_number;
END;
$$;

-- 2. Fix get_default_notifications_by_role
CREATE OR REPLACE FUNCTION public.get_default_notifications_by_role(p_role user_role)
RETURNS notification_type[]
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  CASE p_role
    WHEN 'student' THEN
      RETURN ARRAY[
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
      RETURN ARRAY[
        'system_announcements',
        'child_attendance',
        'child_grades',
        'child_homework',
        'child_bus_location',
        'payment_reminders',
        'school_announcements'
      ]::notification_type[];
    WHEN 'teacher' THEN
      RETURN ARRAY[
        'system_announcements',
        'class_assignments',
        'student_submissions',
        'parent_messages',
        'schedule_changes',
        'leave_approvals',
        'payroll_updates'
      ]::notification_type[];
    WHEN 'admin' THEN
      RETURN ARRAY[
        'system_announcements',
        'user_registrations',
        'system_errors',
        'payment_received',
        'leave_requests',
        'bus_issues',
        'security_alerts'
      ]::notification_type[];
    WHEN 'driver' THEN
      RETURN ARRAY[
        'system_announcements',
        'route_changes',
        'student_pickup',
        'emergency_alerts',
        'vehicle_maintenance'
      ]::notification_type[];
    ELSE
      RETURN ARRAY['system_announcements']::notification_type[];
  END CASE;
END;
$$;

-- 3. Fix set_transaction_number (trigger function)
CREATE OR REPLACE FUNCTION public.set_transaction_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.transaction_number IS NULL THEN
        NEW.transaction_number := generate_transaction_number();
    END IF;
    RETURN NEW;
END;
$$;

-- 4. Fix update_fee_status (trigger function)
CREATE OR REPLACE FUNCTION public.update_fee_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- 5. Fix update_financial_transactions_updated_at (trigger function)
CREATE OR REPLACE FUNCTION public.update_financial_transactions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6. Fix update_updated_at_column (trigger function)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 7. Fix update_visibility_updated_at (trigger function)
CREATE OR REPLACE FUNCTION public.update_visibility_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;