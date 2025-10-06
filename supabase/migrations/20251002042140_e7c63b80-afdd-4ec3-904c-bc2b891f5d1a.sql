-- Create function to process fee payment from wallet
CREATE OR REPLACE FUNCTION process_fee_payment_from_wallet(
  p_fee_id UUID,
  p_amount NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_fee student_fees;
  v_parent_id UUID;
  v_wallet_balance NUMERIC;
  v_payment_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Get fee details
  SELECT * INTO v_fee FROM student_fees WHERE id = p_fee_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Fee not found');
  END IF;
  
  -- Get parent ID from the student
  SELECT parent_id INTO v_parent_id 
  FROM students 
  WHERE id = v_fee.student_id;
  
  -- Check if the current user is the parent
  IF v_parent_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;
  
  -- Check wallet balance
  SELECT balance INTO v_wallet_balance
  FROM wallet_balances
  WHERE user_id = v_parent_id;
  
  IF v_wallet_balance IS NULL OR v_wallet_balance < p_amount THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Insufficient wallet balance',
      'current_balance', COALESCE(v_wallet_balance, 0),
      'required_amount', p_amount
    );
  END IF;
  
  -- Deduct from wallet
  UPDATE wallet_balances
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = v_parent_id;
  
  -- Create payment transaction
  INSERT INTO payment_transactions (
    fee_id,
    parent_id,
    amount,
    payment_method,
    receipt_number,
    created_by
  ) VALUES (
    p_fee_id,
    v_parent_id,
    p_amount,
    'wallet',
    'RCP-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
    v_parent_id
  ) RETURNING id INTO v_payment_id;
  
  -- Update fee paid amount
  UPDATE student_fees 
  SET paid_amount = paid_amount + p_amount,
      updated_at = now()
  WHERE id = p_fee_id;
  
  -- Create wallet transaction record
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
    v_parent_id,
    'payment',
    p_amount,
    v_wallet_balance - p_amount,
    'School fee payment',
    'دفع رسوم مدرسية',
    v_payment_id,
    'fee_payment'
  ) RETURNING id INTO v_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Payment successful',
    'payment_id', v_payment_id,
    'transaction_id', v_transaction_id,
    'remaining_balance', v_wallet_balance - p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_fee_payment_from_wallet TO authenticated;