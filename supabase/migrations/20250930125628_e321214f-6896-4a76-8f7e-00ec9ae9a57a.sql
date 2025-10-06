-- Create employee positions enum
CREATE TYPE public.employee_position AS ENUM (
  'teacher',
  'bus_driver',
  'manager',
  'cleaner',
  'secretary',
  'accountant',
  'nurse',
  'security',
  'cafeteria_staff',
  'maintenance',
  'other'
);

-- Create employees table for all staff types
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  position employee_position NOT NULL,
  custom_position TEXT, -- For 'other' position type
  department TEXT,
  nfc_id TEXT UNIQUE,
  join_date DATE DEFAULT CURRENT_DATE,
  contract_type TEXT DEFAULT 'full-time',
  employment_status TEXT DEFAULT 'active',
  bank_name TEXT,
  bank_account TEXT,
  iban TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  national_id TEXT,
  passport_number TEXT,
  visa_number TEXT,
  visa_expiry DATE,
  insurance_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage employees"
ON public.employees
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

CREATE POLICY "Employees can view own record"
ON public.employees
FOR SELECT
USING (profile_id = auth.uid());

-- Create payment methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  type TEXT NOT NULL CHECK (type IN ('bank_transfer', 'cash', 'cheque', 'wallet', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Everyone can view payment methods"
ON public.payment_methods
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Insert default payment methods
INSERT INTO public.payment_methods (name, name_ar, type) VALUES
('Bank Transfer', 'حوالة بنكية', 'bank_transfer'),
('Cash', 'نقدي', 'cash'),
('Cheque', 'شيك', 'cheque'),
('Digital Wallet', 'محفظة رقمية', 'wallet');

-- Modify payroll_records to include payment method
ALTER TABLE public.payroll_records 
ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id);

-- Create function to generate employee ID
CREATE OR REPLACE FUNCTION public.generate_employee_id(p_position employee_position)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT;
  v_random TEXT;
BEGIN
  -- Set prefix based on position
  CASE p_position
    WHEN 'teacher' THEN v_prefix := 'TCH';
    WHEN 'bus_driver' THEN v_prefix := 'DRV';
    WHEN 'manager' THEN v_prefix := 'MGR';
    WHEN 'cleaner' THEN v_prefix := 'CLN';
    WHEN 'secretary' THEN v_prefix := 'SEC';
    WHEN 'accountant' THEN v_prefix := 'ACC';
    WHEN 'nurse' THEN v_prefix := 'NRS';
    WHEN 'security' THEN v_prefix := 'SEC';
    WHEN 'cafeteria_staff' THEN v_prefix := 'CAF';
    WHEN 'maintenance' THEN v_prefix := 'MNT';
    ELSE v_prefix := 'EMP';
  END CASE;
  
  -- Generate random part
  v_random := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  RETURN v_prefix || '-' || v_random;
END;
$$;

-- Create function to generate NFC ID
CREATE OR REPLACE FUNCTION public.generate_nfc_id(p_position employee_position)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT;
  v_random TEXT;
BEGIN
  -- Set prefix based on position
  CASE p_position
    WHEN 'teacher' THEN v_prefix := 'NFC-TCH';
    WHEN 'bus_driver' THEN v_prefix := 'NFC-DRV';
    WHEN 'manager' THEN v_prefix := 'NFC-MGR';
    ELSE v_prefix := 'NFC-EMP';
  END CASE;
  
  -- Generate random part
  v_random := LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
  
  RETURN v_prefix || '-' || v_random;
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing teachers to employees table
INSERT INTO public.employees (
  profile_id,
  employee_id,
  position,
  nfc_id,
  join_date,
  created_at
)
SELECT 
  t.profile_id,
  t.employee_id,
  'teacher'::employee_position,
  t.nfc_id,
  t.join_date,
  t.created_at
FROM teachers t
WHERE NOT EXISTS (
  SELECT 1 FROM employees e
  WHERE e.profile_id = t.profile_id
);

-- Migrate existing drivers to employees table
INSERT INTO public.employees (
  profile_id,
  employee_id,
  position,
  join_date,
  created_at
)
SELECT 
  d.profile_id,
  d.employee_id,
  'bus_driver'::employee_position,
  d.join_date,
  d.created_at
FROM drivers d
WHERE NOT EXISTS (
  SELECT 1 FROM employees e
  WHERE e.profile_id = d.profile_id
);