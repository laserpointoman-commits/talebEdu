-- Drop the problematic trigger that's causing recursion
DROP TRIGGER IF EXISTS on_profile_created_init_notifications ON profiles;

-- Drop the function that might be causing issues
DROP FUNCTION IF EXISTS initialize_notification_preferences();

-- Fix the profiles RLS policies to avoid recursion
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create simpler, non-recursive RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create a simpler function to initialize notification preferences without recursion
CREATE OR REPLACE FUNCTION initialize_user_notifications()
RETURNS TRIGGER AS $$
DECLARE
  notification notification_type;
  notifications notification_type[];
BEGIN
  -- Determine notifications based on role
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
  
  -- Insert default preferences
  FOREACH notification IN ARRAY notifications
  LOOP
    INSERT INTO notification_preferences (user_id, notification_type, enabled, email_enabled, push_enabled, sms_enabled)
    VALUES (NEW.id, notification, true, true, true, false)
    ON CONFLICT (user_id, notification_type) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on profiles table
CREATE TRIGGER after_profile_created_init_notifications
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_user_notifications();