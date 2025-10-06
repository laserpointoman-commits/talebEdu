-- Add finance role to user_role enum (this needs to be done first and committed)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'finance';