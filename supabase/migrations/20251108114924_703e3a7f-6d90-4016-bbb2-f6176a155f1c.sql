-- Create parent registration tokens table
CREATE TABLE IF NOT EXISTS public.parent_registration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  student_registered_id UUID REFERENCES public.students(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.parent_registration_tokens ENABLE ROW LEVEL SECURITY;

-- Parents can view their own tokens
CREATE POLICY "Parents can view own tokens"
  ON public.parent_registration_tokens FOR SELECT
  USING (parent_id = auth.uid());

-- Admins can view all tokens
CREATE POLICY "Admins can view all tokens"
  ON public.parent_registration_tokens FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Public can validate tokens (for the registration form)
CREATE POLICY "Public can validate tokens"
  ON public.parent_registration_tokens FOR SELECT
  USING (used = false AND expires_at > NOW());

-- System can insert tokens
CREATE POLICY "System can insert tokens"
  ON public.parent_registration_tokens FOR INSERT
  WITH CHECK (true);

-- System can update tokens
CREATE POLICY "System can update tokens"
  ON public.parent_registration_tokens FOR UPDATE
  USING (true);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_parent_registration_tokens_token ON public.parent_registration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_parent_registration_tokens_parent_id ON public.parent_registration_tokens(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_registration_tokens_expires_at ON public.parent_registration_tokens(expires_at);