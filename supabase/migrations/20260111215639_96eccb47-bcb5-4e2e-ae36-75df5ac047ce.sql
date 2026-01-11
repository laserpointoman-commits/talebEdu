-- Add home location fields to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS home_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS home_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS home_area TEXT,
ADD COLUMN IF NOT EXISTS home_area_ar TEXT;