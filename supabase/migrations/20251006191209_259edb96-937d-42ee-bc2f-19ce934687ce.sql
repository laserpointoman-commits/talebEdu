-- Add new specialized attendance roles to user_role enum
-- These will be committed before being used
ALTER TYPE user_role ADD VALUE 'school_attendance';
ALTER TYPE user_role ADD VALUE 'bus_attendance';