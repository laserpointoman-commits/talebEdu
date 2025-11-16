-- Add fields to student_fees table for installments, discounts, and late fees
ALTER TABLE student_fees 
ADD COLUMN IF NOT EXISTS installment_plan_id UUID REFERENCES installment_plans(id),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_reason TEXT,
ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_reminder_date DATE;

-- Add fields to payment_transactions table for receipts
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

-- Create payment_reminders table
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before_due', 'overdue', 'final_notice')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parent_notified BOOLEAN DEFAULT false,
  notification_method TEXT DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create late_fee_config table
CREATE TABLE IF NOT EXISTS late_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type TEXT NOT NULL,
  grace_days INTEGER NOT NULL DEFAULT 0,
  late_fee_amount NUMERIC,
  late_fee_percentage NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create financial_reports_cache table
CREATE TABLE IF NOT EXISTS financial_reports_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  report_date DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(report_type, report_date)
);

-- Enable RLS
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_reminders
CREATE POLICY "Admins can manage payment reminders"
  ON payment_reminders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Parents can view their reminders"
  ON payment_reminders FOR SELECT
  USING (fee_id IN (
    SELECT sf.id FROM student_fees sf
    JOIN students s ON s.id = sf.student_id
    WHERE s.parent_id = auth.uid()
  ));

-- RLS Policies for late_fee_config
CREATE POLICY "Admins can manage late fee config"
  ON late_fee_config FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'finance')
  ));

CREATE POLICY "Everyone can view late fee config"
  ON late_fee_config FOR SELECT
  USING (true);

-- RLS Policies for financial_reports_cache
CREATE POLICY "Admins can manage reports cache"
  ON financial_reports_cache FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'finance')
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_reminders_fee_id ON payment_reminders(fee_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_sent_at ON payment_reminders(sent_at);
CREATE INDEX IF NOT EXISTS idx_student_fees_installment_plan ON student_fees(installment_plan_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_reminder_date ON student_fees(last_reminder_date);
CREATE INDEX IF NOT EXISTS idx_financial_reports_cache_type_date ON financial_reports_cache(report_type, report_date);