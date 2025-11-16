-- Fix existing students with NULL nfc_id
UPDATE students 
SET nfc_id = 'NFC-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || UPPER(substring(md5(random()::text || id::text) from 1 for 4))
WHERE nfc_id IS NULL;

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_boarding_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_student_approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_history;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_students_nfc_id ON students(nfc_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_bus_logs_student ON bus_boarding_logs(student_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notification_history(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bus_locations_bus ON bus_locations(bus_id, timestamp DESC);

-- Ensure bus_locations has all needed columns
ALTER TABLE bus_locations ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();