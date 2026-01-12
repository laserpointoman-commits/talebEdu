-- Add bus boarding/exit notification types to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bus_boarding';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bus_exit';