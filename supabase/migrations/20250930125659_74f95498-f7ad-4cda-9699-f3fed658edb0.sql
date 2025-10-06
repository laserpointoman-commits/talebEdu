-- Fix search_path for existing functions
ALTER FUNCTION public.generate_employee_id(employee_position) SET search_path = public;
ALTER FUNCTION public.generate_nfc_id(employee_position) SET search_path = public;

-- Update payroll config to work with all employees
ALTER TABLE public.payroll_config 
ADD COLUMN employee_id UUID REFERENCES public.employees(id);

-- Migrate existing teacher payroll configs to use employee_id
UPDATE public.payroll_config pc
SET employee_id = e.id
FROM public.employees e
JOIN public.teachers t ON t.profile_id = e.profile_id
WHERE pc.teacher_id = t.id;

-- Create new payroll management function for all employees
CREATE OR REPLACE FUNCTION public.calculate_employee_salary(
  p_employee_id uuid, 
  p_period_start date, 
  p_period_end date
)
RETURNS TABLE(
  base_salary numeric,
  working_days integer,
  present_days integer,
  absent_days integer,
  leave_days integer,
  total_hours numeric,
  overtime_hours numeric,
  deductions numeric,
  bonuses numeric,
  net_salary numeric
)
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
  -- Get employee's payroll config
  SELECT base_salary, hourly_rate 
  INTO v_base_salary, v_hourly_rate
  FROM payroll_config
  WHERE employee_id = p_employee_id;

  IF v_base_salary IS NULL THEN
    RAISE EXCEPTION 'No payroll configuration found for employee';
  END IF;

  -- Calculate working days (excluding weekends)
  SELECT COUNT(*)
  INTO v_working_days
  FROM generate_series(p_period_start, p_period_end, '1 day'::interval) d
  WHERE EXTRACT(DOW FROM d) NOT IN (5, 6); -- Friday and Saturday

  -- For now, set default values (can be expanded later with attendance tracking)
  v_present_days := v_working_days;
  v_absent_days := 0;
  v_leave_days := 0;
  v_total_hours := v_working_days * 8;
  v_overtime_hours := 0;

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