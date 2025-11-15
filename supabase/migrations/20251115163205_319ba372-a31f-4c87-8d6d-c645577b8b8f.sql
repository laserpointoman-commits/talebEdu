-- Phase 1: Create pending_parent_registrations table
CREATE TABLE IF NOT EXISTS public.pending_parent_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles(id),
  max_students INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on pending_parent_registrations
ALTER TABLE public.pending_parent_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_parent_registrations
CREATE POLICY "Admins can view all registration tokens"
  ON public.pending_parent_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert registration tokens"
  ON public.pending_parent_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update registration tokens"
  ON public.pending_parent_registrations
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Public can validate tokens"
  ON public.pending_parent_registrations
  FOR SELECT
  TO anon
  USING (used = false AND expires_at > now());

-- Phase 2: Create pending_student_approvals table
CREATE TABLE IF NOT EXISTS public.pending_student_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.profiles(id) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on pending_student_approvals
ALTER TABLE public.pending_student_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_student_approvals
CREATE POLICY "Admins can manage all approvals"
  ON public.pending_student_approvals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Parents can view their own approvals"
  ON public.pending_student_approvals
  FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

-- Phase 3: Modify profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expected_students_count INTEGER,
  ADD COLUMN IF NOT EXISTS registered_students_count INTEGER DEFAULT 0;

-- Phase 4: Modify students table
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS visible_to_parent BOOLEAN DEFAULT false;

-- Update existing students to be approved and visible
UPDATE public.students
SET approval_status = 'approved',
    visible_to_parent = true,
    submitted_at = created_at
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Phase 5: Update RLS policies for students table to respect approval status
DROP POLICY IF EXISTS "Parents can view their children" ON public.students;
DROP POLICY IF EXISTS "Parents can view their children's data" ON public.students;

CREATE POLICY "Parents can view their approved children"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    parent_id = auth.uid() 
    AND visible_to_parent = true
  );

CREATE POLICY "Parents can insert students for approval"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Admins can view all students"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all students"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );