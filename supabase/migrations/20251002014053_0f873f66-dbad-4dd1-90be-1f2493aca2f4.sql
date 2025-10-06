-- Create role_feature_visibility table to manage feature visibility per role
CREATE TABLE public.role_feature_visibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, feature_key)
);

-- Enable RLS
ALTER TABLE public.role_feature_visibility ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Developers can manage visibility settings" 
ON public.role_feature_visibility 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'developer'::user_role
));

CREATE POLICY "Authenticated users can view visibility settings" 
ON public.role_feature_visibility 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_visibility_updated_at
BEFORE UPDATE ON public.role_feature_visibility
FOR EACH ROW
EXECUTE FUNCTION public.update_visibility_updated_at();

-- Insert default visibility settings for admin role
INSERT INTO public.role_feature_visibility (role, feature_key, feature_name, category, is_visible) VALUES
('admin', 'user_management', 'User Management', 'admin', false),
('admin', 'register_student', 'Register Student', 'students', true),
('admin', 'view_students', 'View Students', 'students', true),
('admin', 'view_teachers', 'View Teachers', 'teachers', true),
('admin', 'manage_classes', 'Manage Classes', 'academic', true),
('admin', 'attendance_tracking', 'Attendance Tracking', 'academic', true),
('admin', 'homework_management', 'Homework Management', 'academic', true),
('admin', 'exam_management', 'Exam Management', 'academic', true),
('admin', 'grade_management', 'Grade Management', 'academic', true),
('admin', 'transport_management', 'Transport Management', 'transport', true),
('admin', 'canteen_management', 'Canteen Management', 'services', true),
('admin', 'store_management', 'Store Management', 'services', true),
('admin', 'finance_module', 'Finance Module', 'finance', true),
('admin', 'payroll_management', 'Payroll Management', 'finance', true),
('admin', 'messaging_system', 'Messaging System', 'communication', true),
('admin', 'reports_analytics', 'Reports & Analytics', 'reports', true),
('admin', 'settings', 'Settings', 'system', true),
('admin', 'employee_management', 'Employee Management', 'staff', true);

-- Insert default visibility settings for teacher role
INSERT INTO public.role_feature_visibility (role, feature_key, feature_name, category, is_visible) VALUES
('teacher', 'view_students', 'View Students', 'students', true),
('teacher', 'manage_classes', 'Manage Classes', 'academic', true),
('teacher', 'attendance_tracking', 'Attendance Tracking', 'academic', true),
('teacher', 'homework_management', 'Homework Management', 'academic', true),
('teacher', 'exam_management', 'Exam Management', 'academic', true),
('teacher', 'grade_management', 'Grade Management', 'academic', true),
('teacher', 'messaging_system', 'Messaging System', 'communication', true),
('teacher', 'reports_analytics', 'Reports & Analytics', 'reports', true),
('teacher', 'payroll_view', 'View Payroll', 'finance', true);

-- Insert default visibility settings for parent role
INSERT INTO public.role_feature_visibility (role, feature_key, feature_name, category, is_visible) VALUES
('parent', 'view_children', 'View Children', 'students', true),
('parent', 'attendance_view', 'View Attendance', 'academic', true),
('parent', 'homework_view', 'View Homework', 'academic', true),
('parent', 'grades_view', 'View Grades', 'academic', true),
('parent', 'transport_tracking', 'Transport Tracking', 'transport', true),
('parent', 'canteen_orders', 'Canteen Orders', 'services', true),
('parent', 'store_purchases', 'Store Purchases', 'services', true),
('parent', 'wallet_management', 'Wallet Management', 'finance', true),
('parent', 'messaging_system', 'Messaging System', 'communication', true);

-- Insert default visibility settings for student role
INSERT INTO public.role_feature_visibility (role, feature_key, feature_name, category, is_visible) VALUES
('student', 'social_hub', 'Social Hub', 'social', true),
('student', 'friends', 'Friends', 'social', true),
('student', 'messaging', 'Messaging', 'communication', true),
('student', 'schedule_view', 'View Schedule', 'academic', true),
('student', 'homework_view', 'View Homework', 'academic', true),
('student', 'exam_schedule', 'Exam Schedule', 'academic', true),
('student', 'grades_view', 'View Grades', 'academic', true),
('student', 'wallet', 'Wallet', 'finance', true),
('student', 'store', 'Store', 'services', true);