-- =====================================================
-- ADVANCED SCALABILITY: Rate Limiting + Monitoring
-- =====================================================

-- 1. Add indexes for cron job processing efficiency
CREATE INDEX IF NOT EXISTS idx_notification_queue_processing 
ON public.notification_queue(status, attempts, created_at) 
WHERE status IN ('pending', 'failed');

-- 2. Create rate limiting table for device flood protection
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    action_type TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    request_count INTEGER DEFAULT 1,
    UNIQUE(identifier, action_type, window_start)
);

-- Index for fast rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits(identifier, action_type, window_start DESC);

-- Simple index for cleanup (no partial predicate with now())
CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
ON public.rate_limits(window_start);

-- RLS for rate limits (service role only)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON public.rate_limits;
CREATE POLICY "Service role only" ON public.rate_limits FOR ALL USING (false);

-- 3. Function: Check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action_type TEXT,
    p_max_requests INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_current_count INTEGER;
BEGIN
    v_window_start := date_trunc('minute', now());
    
    INSERT INTO rate_limits (identifier, action_type, window_start, request_count)
    VALUES (p_identifier, p_action_type, v_window_start, 1)
    ON CONFLICT (identifier, action_type, window_start) 
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO v_current_count;
    
    RETURN v_current_count <= p_max_requests;
END;
$$;

-- 4. Function: Cleanup old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM rate_limits 
    WHERE window_start < now() - interval '1 hour';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- 5. Function: Get notification queue stats
CREATE OR REPLACE FUNCTION public.get_notification_queue_stats()
RETURNS TABLE (
    pending_count BIGINT,
    processing_count BIGINT,
    failed_count BIGINT,
    sent_today BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'processing'),
        COUNT(*) FILTER (WHERE status = 'failed' AND attempts >= max_attempts),
        COUNT(*) FILTER (WHERE status = 'sent' AND processed_at > now() - interval '24 hours')
    FROM notification_queue;
$$;

-- 6. Add processing_started_at column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_queue' AND column_name = 'processing_started_at'
    ) THEN
        ALTER TABLE notification_queue ADD COLUMN processing_started_at TIMESTAMPTZ;
    END IF;
END $$;

-- 7. Function: Unstick stuck notifications
CREATE OR REPLACE FUNCTION public.unstick_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_unstuck INTEGER;
BEGIN
    UPDATE notification_queue
    SET status = CASE 
        WHEN attempts >= max_attempts THEN 'failed'
        ELSE 'pending'
    END,
    error_message = COALESCE(error_message, '') || ' | Reset at ' || now()::TEXT
    WHERE status = 'processing'
    AND (processing_started_at IS NULL OR processing_started_at < now() - interval '5 minutes');
    
    GET DIAGNOSTICS v_unstuck = ROW_COUNT;
    RETURN v_unstuck;
END;
$$;

-- 8. System health view
CREATE OR REPLACE VIEW public.system_health AS
SELECT 
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM attendance_records WHERE date = CURRENT_DATE) as today_attendance,
    (SELECT COUNT(*) FROM bus_boarding_logs WHERE timestamp::date = CURRENT_DATE) as today_bus_activity,
    (SELECT COUNT(*) FROM notification_queue WHERE status = 'pending') as pending_notifications,
    (SELECT COUNT(*) FROM notification_queue WHERE status = 'failed') as failed_notifications;