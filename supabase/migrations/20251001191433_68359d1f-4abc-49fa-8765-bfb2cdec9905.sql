-- Create storage bucket for transaction documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-documents', 'transaction-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for transaction documents
CREATE POLICY "Users can upload transaction documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'transaction-documents' AND 
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'finance')
  )
);

CREATE POLICY "Users can view transaction documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'transaction-documents' AND 
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'finance')
  )
);

CREATE POLICY "Users can update their transaction documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'transaction-documents' AND 
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'finance')
  )
);

CREATE POLICY "Users can delete their transaction documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'transaction-documents' AND 
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'finance')
  )
);

-- Add documents field to financial_transactions table
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Add more fields for better transaction tracking
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create an update trigger for updated_at
CREATE OR REPLACE FUNCTION update_financial_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON financial_transactions
FOR EACH ROW
EXECUTE FUNCTION update_financial_transactions_updated_at();