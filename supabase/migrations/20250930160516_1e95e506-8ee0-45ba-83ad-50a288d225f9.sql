-- Add missing columns to parental_controls table
ALTER TABLE parental_controls 
ADD COLUMN IF NOT EXISTS weekly_spending_limit NUMERIC DEFAULT 25.00,
ADD COLUMN IF NOT EXISTS category_restrictions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS time_restrictions JSONB DEFAULT '{"startTime": "07:00", "endTime": "14:00", "enabled": true}'::jsonb,
ADD COLUMN IF NOT EXISTS blocked_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allowed_items JSONB DEFAULT '[]'::jsonb;