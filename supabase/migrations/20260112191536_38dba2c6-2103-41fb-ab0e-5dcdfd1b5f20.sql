-- Add NFC PIN hash column to profiles table for staff NFC login
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nfc_pin_hash TEXT DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.nfc_pin_hash IS 'Hashed 4-digit PIN for NFC-only login (staff only)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_nfc_pin_hash ON public.profiles(nfc_pin_hash) WHERE nfc_pin_hash IS NOT NULL;