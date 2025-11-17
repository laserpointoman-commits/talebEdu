-- Create student fee history table for complete audit trail
CREATE TABLE IF NOT EXISTS public.student_fee_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_fee_id UUID REFERENCES public.student_fees(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'payment', 'discount_added', 'discount_removed', 'late_fee_added', 'installment_modified', 'due_date_changed', 'note_added')),
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  old_values JSONB DEFAULT '{}'::jsonb,
  new_values JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  description_ar TEXT,
  amount NUMERIC(10, 3),
  payment_method TEXT,
  transaction_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.student_fee_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_fee_history
CREATE POLICY "Admins and finance can view all fee history"
  ON public.student_fee_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Parents can view their children's fee history"
  ON public.student_fee_history
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "System can insert fee history"
  ON public.student_fee_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can insert fee history"
  ON public.student_fee_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'finance')
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_fee_history_student_fee_id ON public.student_fee_history(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_history_student_id ON public.student_fee_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_history_changed_at ON public.student_fee_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_fee_history_action_type ON public.student_fee_history(action_type);

-- Add indexes to student_fees for better performance
CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON public.student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON public.student_fees(status);
CREATE INDEX IF NOT EXISTS idx_student_fees_due_date ON public.student_fees(due_date);

COMMENT ON TABLE public.student_fee_history IS 'Audit trail for all student fee changes and transactions';
COMMENT ON COLUMN public.student_fee_history.action_type IS 'Type of action: created, updated, payment, discount_added, late_fee_added, etc.';
COMMENT ON COLUMN public.student_fee_history.old_values IS 'JSON snapshot of values before change';
COMMENT ON COLUMN public.student_fee_history.new_values IS 'JSON snapshot of values after change';