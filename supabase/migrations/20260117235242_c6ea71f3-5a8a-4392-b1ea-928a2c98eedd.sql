-- Fix security definer view warning
DROP VIEW IF EXISTS public.system_health;
CREATE VIEW public.system_health WITH (security_invoker = on) AS
SELECT 
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM attendance_records WHERE date = CURRENT_DATE) as today_attendance,
    (SELECT COUNT(*) FROM bus_boarding_logs WHERE timestamp::date = CURRENT_DATE) as today_bus_activity,
    (SELECT COUNT(*) FROM notification_queue WHERE status = 'pending') as pending_notifications,
    (SELECT COUNT(*) FROM notification_queue WHERE status = 'failed') as failed_notifications;