-- =====================================================
-- ENTERPRISE SCALABILITY MIGRATION (FINAL)
-- Handles 100,000+ students with 1000+ concurrent NFC taps
-- =====================================================

-- 1. CRITICAL INDEXES for high-traffic tables

-- Attendance records indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_date 
ON public.attendance_records(student_id, date);

CREATE INDEX IF NOT EXISTS idx_attendance_date_type 
ON public.attendance_records(date, type);

CREATE INDEX IF NOT EXISTS idx_attendance_nfc_lookup 
ON public.attendance_records(student_id, date, type);

-- Bus boarding logs indexes
CREATE INDEX IF NOT EXISTS idx_bus_boarding_student_bus_date 
ON public.bus_boarding_logs(student_id, bus_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_bus_boarding_timestamp 
ON public.bus_boarding_logs(timestamp DESC);

-- Students NFC lookup (most frequent query)
CREATE INDEX IF NOT EXISTS idx_students_nfc_id 
ON public.students(nfc_id) WHERE nfc_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_parent_id 
ON public.students(parent_id);

-- Canteen orders indexes
CREATE INDEX IF NOT EXISTS idx_canteen_orders_student_date 
ON public.canteen_orders(student_id, created_at DESC);

-- Wallet transactions indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user 
ON public.wallet_transactions(user_id, created_at DESC);

-- 2. NOTIFICATION QUEUE TABLE (if not exists from partial migration)
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    idempotency_key TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_pending 
ON public.notification_queue(status, created_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_queue_retry 
ON public.notification_queue(status, attempts, last_attempt_at) 
WHERE status = 'failed' AND attempts < 3;

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role access only" ON public.notification_queue;
CREATE POLICY "Service role access only" 
ON public.notification_queue 
FOR ALL 
USING (false);

-- 3. ADD IDEMPOTENCY KEY COLUMNS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'attendance_records' 
        AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE public.attendance_records 
        ADD COLUMN idempotency_key TEXT UNIQUE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bus_boarding_logs' 
        AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE public.bus_boarding_logs 
        ADD COLUMN idempotency_key TEXT UNIQUE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attendance_idempotency 
ON public.attendance_records(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bus_boarding_idempotency 
ON public.bus_boarding_logs(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 4. FUNCTION: Queue notification for async processing
CREATE OR REPLACE FUNCTION public.queue_parent_notification(
    p_parent_id UUID,
    p_student_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification_id UUID;
    v_idempotency_key TEXT;
BEGIN
    v_idempotency_key := p_parent_id::TEXT || '_' || p_student_id::TEXT || '_' || p_type || '_' || DATE(now())::TEXT || '_' || EXTRACT(HOUR FROM now())::TEXT;
    
    INSERT INTO notification_queue (
        parent_id, student_id, notification_type, 
        title, message, data, idempotency_key
    ) VALUES (
        p_parent_id, p_student_id, p_type,
        p_title, p_message, p_data, v_idempotency_key
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- 5. FUNCTION: Fast student lookup by NFC (without wallet_balance)
CREATE OR REPLACE FUNCTION public.get_student_by_nfc(p_nfc_id TEXT)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    first_name_ar TEXT,
    last_name_ar TEXT,
    parent_id UUID,
    nfc_id TEXT,
    class TEXT
)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
    SELECT 
        s.id,
        s.first_name,
        s.last_name,
        s.first_name_ar,
        s.last_name_ar,
        s.parent_id,
        s.nfc_id,
        s.class
    FROM students s
    WHERE s.nfc_id = p_nfc_id
    LIMIT 1;
$$;

-- 6. FUNCTION: Atomic attendance recording with idempotency
CREATE OR REPLACE FUNCTION public.record_attendance_atomic(
    p_student_id UUID,
    p_date DATE,
    p_time TIME,
    p_type TEXT,
    p_location TEXT,
    p_device_id TEXT,
    p_nfc_verified BOOLEAN DEFAULT true,
    p_manual_entry BOOLEAN DEFAULT false
)
RETURNS TABLE (
    success BOOLEAN,
    attendance_id UUID,
    already_exists BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_attendance_id UUID;
    v_idempotency_key TEXT;
    v_existing_id UUID;
BEGIN
    v_idempotency_key := p_student_id::TEXT || '_' || p_date::TEXT || '_' || p_type;
    
    SELECT ar.id INTO v_existing_id
    FROM attendance_records ar
    WHERE ar.student_id = p_student_id 
      AND ar.date = p_date 
      AND ar.type = p_type
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN QUERY SELECT false, v_existing_id, true, 'Already recorded'::TEXT;
        RETURN;
    END IF;
    
    INSERT INTO attendance_records (
        student_id, date, time, type, status, 
        method, location, nfc_verified, manual_entry, 
        recorded_by, idempotency_key
    ) VALUES (
        p_student_id, p_date, p_time, p_type, 'present',
        CASE WHEN p_nfc_verified THEN 'nfc' ELSE 'manual' END,
        p_location, p_nfc_verified, p_manual_entry,
        p_device_id, v_idempotency_key
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING attendance_records.id INTO v_attendance_id;
    
    IF v_attendance_id IS NOT NULL THEN
        RETURN QUERY SELECT true, v_attendance_id, false, NULL::TEXT;
    ELSE
        SELECT ar.id INTO v_attendance_id
        FROM attendance_records ar
        WHERE ar.idempotency_key = v_idempotency_key;
        
        RETURN QUERY SELECT false, v_attendance_id, true, 'Duplicate request'::TEXT;
    END IF;
END;
$$;

-- 7. FUNCTION: Atomic bus boarding with idempotency
CREATE OR REPLACE FUNCTION public.record_bus_boarding_atomic(
    p_student_id UUID,
    p_bus_id UUID,
    p_action TEXT,
    p_location TEXT,
    p_latitude DOUBLE PRECISION DEFAULT NULL,
    p_longitude DOUBLE PRECISION DEFAULT NULL,
    p_nfc_verified BOOLEAN DEFAULT true,
    p_manual_entry BOOLEAN DEFAULT false,
    p_manual_entry_by TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    boarding_id UUID,
    already_exists BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_boarding_id UUID;
    v_idempotency_key TEXT;
    v_last_action TEXT;
    v_db_action TEXT;
BEGIN
    v_db_action := CASE WHEN p_action = 'board' THEN 'boarded' ELSE 'exited' END;
    v_idempotency_key := p_student_id::TEXT || '_' || p_bus_id::TEXT || '_' || DATE(now())::TEXT || '_' || v_db_action || '_' || EXTRACT(HOUR FROM now())::TEXT;
    
    -- Check last action to prevent duplicates
    SELECT bbl.action INTO v_last_action
    FROM bus_boarding_logs bbl
    WHERE bbl.student_id = p_student_id 
      AND bbl.bus_id = p_bus_id
      AND bbl.timestamp >= DATE(now())
    ORDER BY bbl.timestamp DESC
    LIMIT 1;
    
    IF v_last_action = v_db_action THEN
        RETURN QUERY SELECT false, NULL::UUID, true, ('Already ' || v_db_action)::TEXT;
        RETURN;
    END IF;
    
    INSERT INTO bus_boarding_logs (
        student_id, bus_id, action, location,
        latitude, longitude, timestamp,
        nfc_verified, manual_entry, manual_entry_by, idempotency_key
    ) VALUES (
        p_student_id, p_bus_id, v_db_action, p_location,
        p_latitude, p_longitude, now(),
        p_nfc_verified, p_manual_entry, p_manual_entry_by, v_idempotency_key
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING bus_boarding_logs.id INTO v_boarding_id;
    
    IF v_boarding_id IS NOT NULL THEN
        RETURN QUERY SELECT true, v_boarding_id, false, NULL::TEXT;
    ELSE
        RETURN QUERY SELECT false, NULL::UUID, true, 'Duplicate request'::TEXT;
    END IF;
END;
$$;

-- 8. Enable realtime for notification queue
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notification_queue'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_queue;
    END IF;
END $$;