-- Add missing columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS profile_image text;