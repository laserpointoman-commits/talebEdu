-- Ensure every user has a wallet (update existing table structure)
-- First, let's make sure the wallet_balances table is properly set up
ALTER TABLE wallet_balances 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'OMR',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create wallet transfers table for tracking transfers between users
CREATE TABLE IF NOT EXISTS wallet_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES profiles(id),
  to_user_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'OMR',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  notes TEXT,
  reference_number TEXT DEFAULT ('TRF-' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT different_users CHECK (from_user_id != to_user_id)
);

-- Enable RLS on wallet_transfers
ALTER TABLE wallet_transfers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wallet_transfers
CREATE POLICY "Users can view their own transfers"
ON wallet_transfers
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create transfers from their wallet"
ON wallet_transfers
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- Create function to process wallet transfers
CREATE OR REPLACE FUNCTION public.process_wallet_transfer(
  p_to_user_id UUID,
  p_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS wallet_transfers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_user_id UUID;
  v_from_balance NUMERIC;
  v_transfer_record wallet_transfers;
  v_to_balance_after NUMERIC;
  v_from_balance_after NUMERIC;
BEGIN
  -- Get current user ID
  v_from_user_id := auth.uid();
  
  -- Check if sender and receiver are different
  IF v_from_user_id = p_to_user_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same wallet';
  END IF;
  
  -- Check sender's balance
  SELECT balance INTO v_from_balance
  FROM wallet_balances
  WHERE user_id = v_from_user_id
  FOR UPDATE;
  
  IF v_from_balance IS NULL THEN
    -- Create wallet if doesn't exist
    INSERT INTO wallet_balances (user_id, balance)
    VALUES (v_from_user_id, 0);
    v_from_balance := 0;
  END IF;
  
  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %, Required: %', v_from_balance, p_amount;
  END IF;
  
  -- Check if recipient exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_to_user_id) THEN
    RAISE EXCEPTION 'Recipient user not found';
  END IF;
  
  -- Ensure recipient has a wallet
  INSERT INTO wallet_balances (user_id, balance)
  VALUES (p_to_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Deduct from sender
  UPDATE wallet_balances
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = v_from_user_id
  RETURNING balance INTO v_from_balance_after;
  
  -- Add to recipient
  UPDATE wallet_balances
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_to_user_id
  RETURNING balance INTO v_to_balance_after;
  
  -- Create transfer record
  INSERT INTO wallet_transfers (
    from_user_id,
    to_user_id,
    amount,
    notes,
    status,
    completed_at
  ) VALUES (
    v_from_user_id,
    p_to_user_id,
    p_amount,
    p_notes,
    'completed',
    now()
  ) RETURNING * INTO v_transfer_record;
  
  -- Create transaction records for both users
  -- Sender transaction
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    description_ar,
    reference_id,
    reference_type
  ) VALUES (
    v_from_user_id,
    'transfer_out',
    p_amount,
    v_from_balance_after,
    'Transfer to user',
    'تحويل إلى مستخدم',
    v_transfer_record.id,
    'wallet_transfer'
  );
  
  -- Recipient transaction
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    description_ar,
    reference_id,
    reference_type
  ) VALUES (
    p_to_user_id,
    'transfer_in',
    p_amount,
    v_to_balance_after,
    'Transfer from user',
    'تحويل من مستخدم',
    v_transfer_record.id,
    'wallet_transfer'
  );
  
  RETURN v_transfer_record;
END;
$$;

-- Create function to initialize wallet for new users
CREATE OR REPLACE FUNCTION public.initialize_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create wallet for new user with initial balance of 0
  INSERT INTO wallet_balances (user_id, balance, currency)
  VALUES (NEW.id, 0, 'OMR')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create wallet for new users
DROP TRIGGER IF EXISTS create_wallet_on_user_signup ON profiles;
CREATE TRIGGER create_wallet_on_user_signup
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.initialize_user_wallet();

-- Initialize wallets for existing users who don't have one
INSERT INTO wallet_balances (user_id, balance, currency)
SELECT id, 0, 'OMR'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM wallet_balances WHERE wallet_balances.user_id = profiles.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Add wallet transaction types if they don't exist
ALTER TABLE wallet_transactions 
DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

ALTER TABLE wallet_transactions
ADD CONSTRAINT wallet_transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'refund', 'transfer_in', 'transfer_out'));

-- Grant access to the transfer function
GRANT EXECUTE ON FUNCTION public.process_wallet_transfer TO authenticated;