-- 3. ERROR TRACKING TABLE
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    function_name TEXT,
    user_id UUID,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage error logs" ON error_logs
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error(
    p_error_type TEXT,
    p_error_message TEXT,
    p_stack_trace TEXT DEFAULT NULL,
    p_function_name TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_error_id UUID;
BEGIN
    INSERT INTO error_logs (error_type, error_message, stack_trace, function_name, user_id, metadata)
    VALUES (p_error_type, p_error_message, p_stack_trace, p_function_name, p_user_id, p_metadata)
    RETURNING id INTO v_error_id;
    
    RETURN v_error_id;
END;
$$;

-- 4. GDPR DATA DELETION
CREATE OR REPLACE FUNCTION gdpr_delete_student_data(p_student_id UUID, p_deleted_by UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_student RECORD;
    v_deleted_counts JSONB := '{}';
    v_count INTEGER;
BEGIN
    -- Get student info for audit
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student not found');
    END IF;
    
    -- Delete attendance records
    DELETE FROM attendance_records WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('attendance_records', v_count);
    
    -- Delete bus boarding logs
    DELETE FROM bus_boarding_logs WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('bus_boarding_logs', v_count);
    
    -- Delete grades
    DELETE FROM grades WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('grades', v_count);
    
    -- Delete homework submissions
    DELETE FROM homework_submissions WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('homework_submissions', v_count);
    
    -- Delete checkpoint logs
    DELETE FROM checkpoint_logs WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('checkpoint_logs', v_count);
    
    -- Delete canteen orders
    DELETE FROM canteen_orders WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('canteen_orders', v_count);
    
    -- Delete meal orders
    DELETE FROM meal_orders WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('meal_orders', v_count);
    
    -- Delete friendships
    DELETE FROM friendships WHERE student1_id = p_student_id OR student2_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('friendships', v_count);
    
    -- Delete friend requests
    DELETE FROM friend_requests WHERE sender_id = p_student_id OR receiver_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('friend_requests', v_count);
    
    -- Delete chat messages
    DELETE FROM chat_messages WHERE sender_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('chat_messages', v_count);
    
    -- Delete conversation participants
    DELETE FROM conversation_participants WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('conversation_participants', v_count);
    
    -- Delete parental controls
    DELETE FROM parental_controls WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('parental_controls', v_count);
    
    -- Delete canteen restrictions
    DELETE FROM canteen_restrictions WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('canteen_restrictions', v_count);
    
    -- Delete allowance settings
    DELETE FROM allowance_settings WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('allowance_settings', v_count);
    
    -- Delete student fees
    DELETE FROM student_fees WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('student_fees', v_count);
    
    -- Anonymize the student record (keep for referential integrity)
    UPDATE students SET
        first_name = 'DELETED',
        last_name = 'USER',
        first_name_ar = 'محذوف',
        last_name_ar = 'مستخدم',
        email = 'deleted_' || p_student_id::TEXT || '@deleted.local',
        phone = NULL,
        address = NULL,
        photo_url = NULL,
        nfc_id = NULL,
        medical_notes = NULL,
        notes = 'GDPR deletion performed on ' || now()::TEXT
    WHERE id = p_student_id;
    
    -- Log the GDPR deletion
    PERFORM log_audit_event(
        p_deleted_by,
        'gdpr_deletion',
        'students',
        p_student_id,
        to_jsonb(v_student),
        v_deleted_counts,
        jsonb_build_object('deletion_reason', 'GDPR request')
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'student_id', p_student_id,
        'deleted_counts', v_deleted_counts,
        'deleted_at', now()
    );
END;
$$;

-- 5. SYSTEM HEALTH VIEW (enhanced)
DROP VIEW IF EXISTS system_health_dashboard;
CREATE VIEW system_health_dashboard AS
SELECT
    (SELECT COUNT(*) FROM students WHERE status = 'active') as active_students,
    (SELECT COUNT(*) FROM teachers) as active_teachers,
    (SELECT COUNT(*) FROM profiles WHERE role = 'parent') as active_parents,
    (SELECT COUNT(*) FROM attendance_records WHERE date = CURRENT_DATE) as today_attendance,
    (SELECT COUNT(*) FROM bus_boarding_logs WHERE timestamp >= CURRENT_DATE) as today_bus_logs,
    (SELECT COUNT(*) FROM wallet_transactions WHERE created_at >= CURRENT_DATE) as today_transactions,
    (SELECT COUNT(*) FROM notification_queue WHERE status = 'pending') as pending_notifications,
    (SELECT COUNT(*) FROM notification_queue WHERE status = 'failed') as failed_notifications,
    (SELECT COUNT(*) FROM error_logs WHERE created_at >= now() - interval '24 hours' AND NOT resolved) as unresolved_errors_24h,
    (SELECT COUNT(*) FROM error_logs WHERE created_at >= now() - interval '1 hour') as errors_last_hour,
    (SELECT COALESCE(SUM(balance), 0) FROM wallet_balances) as total_wallet_balance,
    (SELECT COALESCE(SUM(balance), 0) FROM admin_wallets) as admin_wallet_balance,
    now() as last_checked;

-- Grant access to admins
GRANT SELECT ON system_health_dashboard TO authenticated;