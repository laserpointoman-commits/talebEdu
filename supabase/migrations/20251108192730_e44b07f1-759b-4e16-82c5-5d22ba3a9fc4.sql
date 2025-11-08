-- Modify parent_registration_tokens table for multiple students support
ALTER TABLE parent_registration_tokens
ADD COLUMN IF NOT EXISTS remaining_uses INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS students_registered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invitation_method VARCHAR(20) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tokens_status ON parent_registration_tokens(used, expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_parent ON parent_registration_tokens(parent_id);

-- Create invitation logs table
CREATE TABLE IF NOT EXISTS parent_invitation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES parent_registration_tokens(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  method VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on invitation logs
ALTER TABLE parent_invitation_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view invitation logs
CREATE POLICY "Admins can view invitation logs"
ON parent_invitation_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'developer')
  )
);

-- Policy for system to insert logs
CREATE POLICY "System can insert invitation logs"
ON parent_invitation_logs FOR INSERT
TO authenticated
WITH CHECK (true);