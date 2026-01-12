-- Update the action check constraint to allow 'absent' status
ALTER TABLE bus_boarding_logs DROP CONSTRAINT IF EXISTS bus_boarding_logs_action_check;

ALTER TABLE bus_boarding_logs ADD CONSTRAINT bus_boarding_logs_action_check 
CHECK (action IN ('boarded', 'exited', 'absent'));