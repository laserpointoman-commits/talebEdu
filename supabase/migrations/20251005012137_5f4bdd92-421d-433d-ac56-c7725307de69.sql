-- Clean up all test users and mock data
-- This will give you a fresh start

-- Delete all test account data
DELETE FROM wallet_transactions;
DELETE FROM wallet_transfers;
DELETE FROM wallet_balances;
DELETE FROM direct_messages;
DELETE FROM message_attachments;
DELETE FROM financial_transactions;
DELETE FROM orders;
DELETE FROM meal_orders;
DELETE FROM fee_payments;
DELETE FROM notification_history;
DELETE FROM grades;
DELETE FROM homework_submissions;
DELETE FROM attendance_records;
DELETE FROM checkpoint_logs;
DELETE FROM parental_controls;
DELETE FROM friend_requests;
DELETE FROM friendships;
DELETE FROM chat_messages;
DELETE FROM conversation_participants;
DELETE FROM conversations;
DELETE FROM leave_requests;
DELETE FROM teacher_attendance;
DELETE FROM payroll_records;
DELETE FROM payroll_transactions;
DELETE FROM student_bus_assignments;
DELETE FROM bus_boarding_logs;
DELETE FROM bus_locations;

-- Delete student and teacher records
DELETE FROM students;
DELETE FROM teachers;
DELETE FROM drivers;
DELETE FROM employees;

-- Delete profiles (this will cascade to auth.users)
DELETE FROM profiles WHERE email LIKE '%talebschool.com';

-- Clear test accounts table
DELETE FROM test_accounts;