-- Create a table to track test accounts
CREATE TABLE IF NOT EXISTS test_accounts (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the test accounts
INSERT INTO test_accounts (email) VALUES 
  ('admin@talebschool.com'),
  ('teacher@talebschool.com'),
  ('student@talebschool.com'),
  ('parent@talebschool.com'),
  ('driver@talebschool.com'),
  ('finance@talebschool.com')
ON CONFLICT (email) DO NOTHING;

-- Create a function to check if an email is a test account
CREATE OR REPLACE FUNCTION is_test_account(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM test_accounts WHERE email = user_email
  );
END;
$$;

-- Create a function to reset test account data
CREATE OR REPLACE FUNCTION reset_test_account_data(test_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_student_id UUID;
BEGIN
  -- Delete data created by test accounts but preserve the accounts themselves
  
  -- Delete messages sent by this user
  DELETE FROM direct_messages WHERE sender_id = test_user_id;
  DELETE FROM message_attachments WHERE message_id NOT IN (SELECT id FROM direct_messages);
  
  -- Delete financial transactions
  DELETE FROM financial_transactions WHERE user_id = test_user_id;
  
  -- Delete wallet transactions (but keep wallet balance at 0)
  DELETE FROM wallet_transactions WHERE user_id = test_user_id;
  UPDATE wallet_balances SET balance = 0 WHERE user_id = test_user_id;
  
  -- Delete orders
  DELETE FROM orders WHERE user_id = test_user_id;
  
  -- Delete meal orders
  DELETE FROM meal_orders WHERE parent_id = test_user_id;
  
  -- Delete fee payments
  DELETE FROM fee_payments WHERE parent_id = test_user_id;
  
  -- Delete notification history
  DELETE FROM notification_history WHERE user_id = test_user_id;
  
  -- For student test account, clean up student-specific data
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id AND role = 'student') THEN
    SELECT id INTO test_student_id FROM students WHERE profile_id = test_user_id;
    
    IF test_student_id IS NOT NULL THEN
      -- Delete grades
      DELETE FROM grades WHERE student_id = test_student_id;
      
      -- Delete homework submissions
      DELETE FROM homework_submissions WHERE student_id = test_student_id;
      
      -- Delete attendance records
      DELETE FROM attendance_records WHERE student_id = test_student_id;
      
      -- Delete checkpoint logs
      DELETE FROM checkpoint_logs WHERE student_id = test_student_id;
      
      -- Delete meal orders
      DELETE FROM meal_orders WHERE student_id = test_student_id;
      
      -- Delete parental controls
      DELETE FROM parental_controls WHERE student_id = test_student_id;
      
      -- Delete friend requests and friendships
      DELETE FROM friend_requests WHERE sender_id = test_student_id OR receiver_id = test_student_id;
      DELETE FROM friendships WHERE student1_id = test_student_id OR student2_id = test_student_id;
      
      -- Delete chat messages and conversations
      DELETE FROM chat_messages WHERE sender_id = test_student_id;
      DELETE FROM conversation_participants WHERE student_id = test_student_id;
    END IF;
  END IF;
  
  -- For teacher test account, clean up teacher-specific data
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id AND role = 'teacher') THEN
    -- Delete leave requests
    DELETE FROM leave_requests WHERE teacher_id IN (SELECT id FROM teachers WHERE profile_id = test_user_id);
    
    -- Delete teacher attendance
    DELETE FROM teacher_attendance WHERE teacher_id IN (SELECT id FROM teachers WHERE profile_id = test_user_id);
    
    -- Delete payroll records
    DELETE FROM payroll_records WHERE teacher_id IN (SELECT id FROM teachers WHERE profile_id = test_user_id);
  END IF;
  
END;
$$;

-- Enable RLS on test_accounts table
ALTER TABLE test_accounts ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage test accounts
CREATE POLICY "Service role can manage test accounts" ON test_accounts
  FOR ALL USING (auth.role() = 'service_role');