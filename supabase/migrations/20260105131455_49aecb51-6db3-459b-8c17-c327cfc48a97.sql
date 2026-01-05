-- Add NFC authentication support to device_configs
ALTER TABLE device_configs 
ADD COLUMN IF NOT EXISTS nfc_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS linked_bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS session_nfc_id TEXT;

-- Create device_sessions table for NFC login/logout tracking
CREATE TABLE IF NOT EXISTS device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES device_configs(device_id) ON DELETE CASCADE,
  nfc_id TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('bus_supervisor', 'bus_driver', 'school_gate', 'teacher')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  UNIQUE(device_id, status) -- Only one active session per device
);

-- Enable RLS on device_sessions
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage device sessions
CREATE POLICY "Allow authenticated to manage sessions" ON device_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add nfc_id to employees table for NFC-based login
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nfc_id TEXT UNIQUE;

-- Create an index for fast NFC lookups
CREATE INDEX IF NOT EXISTS idx_employees_nfc_id ON employees(nfc_id) WHERE nfc_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_device_configs_nfc_id ON device_configs(nfc_id) WHERE nfc_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_active ON device_sessions(device_id) WHERE status = 'active';

-- Add manual attendance override tracking
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS manual_entry BOOLEAN DEFAULT false;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS manual_entry_by UUID REFERENCES auth.users(id);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS nfc_verified BOOLEAN DEFAULT false;

ALTER TABLE bus_boarding_logs ADD COLUMN IF NOT EXISTS manual_entry BOOLEAN DEFAULT false;
ALTER TABLE bus_boarding_logs ADD COLUMN IF NOT EXISTS manual_entry_by UUID REFERENCES auth.users(id);
ALTER TABLE bus_boarding_logs ADD COLUMN IF NOT EXISTS nfc_verified BOOLEAN DEFAULT false;