-- Create quick actions configuration table
CREATE TABLE public.quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  title TEXT NOT NULL,
  href TEXT NOT NULL,
  icon TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_actions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all quick actions
CREATE POLICY "Admins can manage quick actions"
ON public.quick_actions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- All authenticated users can view active quick actions for their role
CREATE POLICY "Users can view their role's quick actions"
ON public.quick_actions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Insert default quick actions
INSERT INTO public.quick_actions (role, title, href, icon, display_order) VALUES
  ('admin', 'dashboard.students', '/dashboard/students', 'GraduationCap', 1),
  ('admin', 'dashboard.teachers', '/dashboard/teachers', 'Users', 2),
  ('admin', 'dashboard.classes', '/dashboard/classes', 'BookOpen', 3),
  ('admin', 'dashboard.attendance', '/dashboard/nfc-attendance', 'ClipboardList', 4),
  ('admin', 'dashboard.transport', '/dashboard/transport', 'Bus', 5),
  ('admin', 'dashboard.finance', '/dashboard/finance', 'DollarSign', 6),
  ('admin', 'Fee Management', '/dashboard/admin/fees', 'Receipt', 7),
  ('admin', 'dashboard.canteen', '/dashboard/canteen', 'ShoppingBag', 8),
  
  ('teacher', 'dashboard.students', '/dashboard/students', 'GraduationCap', 1),
  ('teacher', 'dashboard.classes', '/dashboard/classes', 'BookOpen', 2),
  ('teacher', 'dashboard.schedule', '/dashboard/schedule', 'Calendar', 3),
  ('teacher', 'dashboard.attendance', '/dashboard/nfc-attendance', 'ClipboardList', 4),
  ('teacher', 'dashboard.examSchedule', '/dashboard/exams', 'ClipboardList', 5),
  ('teacher', 'dashboard.homework', '/dashboard/homework', 'FileText', 6),
  ('teacher', 'dashboard.grades', '/dashboard/grades', 'Award', 7),
  ('teacher', 'Payroll', '/dashboard/payroll', 'DollarSign', 8),
  
  ('parent', 'dashboard.schedule', '/dashboard/schedule', 'Calendar', 1),
  ('parent', 'dashboard.examSchedule', '/dashboard/exams', 'ClipboardList', 2),
  ('parent', 'dashboard.homework', '/dashboard/homework', 'FileText', 3),
  ('parent', 'dashboard.grades', '/dashboard/grades', 'Award', 4),
  ('parent', 'dashboard.tracking', '/dashboard/bus-tracking', 'MapPin', 5),
  ('parent', 'dashboard.finance', '/dashboard/finance', 'DollarSign', 6),
  ('parent', 'Parent Finance', '/dashboard/parent-finance', 'CreditCard', 7),
  ('parent', 'dashboard.wallet', '/dashboard/wallet', 'Wallet', 8),
  
  ('student', 'dashboard.schedule', '/dashboard/schedule', 'Calendar', 1),
  ('student', 'dashboard.examSchedule', '/dashboard/exams', 'ClipboardList', 2),
  ('student', 'dashboard.homework', '/dashboard/homework', 'FileText', 3),
  ('student', 'dashboard.grades', '/dashboard/grades', 'Award', 4),
  ('student', 'dashboard.wallet', '/dashboard/wallet', 'Wallet', 5),
  ('student', 'dashboard.canteen', '/dashboard/canteen', 'ShoppingBag', 6),
  ('student', 'dashboard.messages', '/dashboard/messages', 'MessageSquare', 7),
  ('student', 'dashboard.store', '/dashboard/store', 'Package', 8),
  
  ('driver', 'dashboard.tracking', '/dashboard/bus-tracking', 'MapPin', 1),
  ('driver', 'dashboard.reports', '/dashboard/reports', 'FileText', 2),
  
  ('finance', 'dashboard.finance', '/dashboard/finance', 'DollarSign', 1),
  ('finance', 'Fee Management', '/dashboard/admin/fees', 'Receipt', 2),
  ('finance', 'Payroll', '/dashboard/payroll', 'DollarSign', 3),
  ('finance', 'dashboard.reports', '/dashboard/reports', 'FileText', 4);