-- Add transaction_number column to financial_transactions
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS transaction_number TEXT UNIQUE;

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_financial_transactions_number 
ON public.financial_transactions(transaction_number);

-- Create function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
    v_sequence INTEGER;
    v_month TEXT;
    v_year TEXT;
    v_transaction_number TEXT;
BEGIN
    -- Get current month and year
    v_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(transaction_number, '-', 1) AS INTEGER)
    ), 0) + 1
    INTO v_sequence
    FROM financial_transactions
    WHERE transaction_number LIKE '____-' || v_month || '-' || v_year;
    
    -- Format: XXXX-MM-YYYY
    v_transaction_number := LPAD(v_sequence::TEXT, 4, '0') || '-' || v_month || '-' || v_year;
    
    RETURN v_transaction_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate transaction numbers
CREATE OR REPLACE FUNCTION set_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_number IS NULL THEN
        NEW.transaction_number := generate_transaction_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to financial_transactions
DROP TRIGGER IF EXISTS set_transaction_number_trigger ON financial_transactions;
CREATE TRIGGER set_transaction_number_trigger
BEFORE INSERT ON financial_transactions
FOR EACH ROW
EXECUTE FUNCTION set_transaction_number();

-- Update existing transactions with transaction numbers
DO $$
DECLARE
    rec RECORD;
    v_counter INTEGER := 1;
    v_month TEXT;
    v_year TEXT;
    v_current_month TEXT := '';
BEGIN
    FOR rec IN 
        SELECT id, transaction_date 
        FROM financial_transactions 
        WHERE transaction_number IS NULL
        ORDER BY transaction_date, created_at
    LOOP
        v_month := LPAD(EXTRACT(MONTH FROM rec.transaction_date)::TEXT, 2, '0');
        v_year := EXTRACT(YEAR FROM rec.transaction_date)::TEXT;
        
        -- Reset counter for new month
        IF v_current_month != v_month || '-' || v_year THEN
            v_counter := 1;
            v_current_month := v_month || '-' || v_year;
        END IF;
        
        UPDATE financial_transactions
        SET transaction_number = LPAD(v_counter::TEXT, 4, '0') || '-' || v_month || '-' || v_year
        WHERE id = rec.id;
        
        v_counter := v_counter + 1;
    END LOOP;
END $$;