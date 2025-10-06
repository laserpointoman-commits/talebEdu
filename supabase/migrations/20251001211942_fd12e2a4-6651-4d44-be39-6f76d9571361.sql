-- Drop existing messages table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create direct_messages table for role-based messaging
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_recipient ON public.direct_messages(recipient_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create a function to check if messaging is allowed based on roles
CREATE OR REPLACE FUNCTION can_message(sender_id UUID, recipient_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sender_role user_role;
  recipient_role user_role;
  sender_student_class TEXT;
  recipient_student_class TEXT;
  has_common_student BOOLEAN;
BEGIN
  -- Get sender role
  SELECT role INTO sender_role FROM profiles WHERE id = sender_id;
  -- Get recipient role
  SELECT role INTO recipient_role FROM profiles WHERE id = recipient_id;
  
  -- Admin can message anyone
  IF sender_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Teachers can message teachers, students, admin, and finance
  IF sender_role = 'teacher' THEN
    IF recipient_role IN ('teacher', 'student', 'admin', 'finance') THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Parents can message admin and teachers who teach their children
  IF sender_role = 'parent' THEN
    IF recipient_role = 'admin' THEN
      RETURN TRUE;
    END IF;
    
    -- Check if recipient is a teacher who teaches any of parent's children
    IF recipient_role = 'teacher' THEN
      SELECT EXISTS(
        SELECT 1 
        FROM students s
        JOIN classes c ON s.class = c.name
        JOIN teachers t ON t.id = c.class_teacher_id
        WHERE s.parent_id = sender_id 
        AND t.profile_id = recipient_id
      ) INTO has_common_student;
      
      RETURN has_common_student;
    END IF;
  END IF;
  
  -- Students can only message students in their class
  IF sender_role = 'student' THEN
    IF recipient_role = 'student' THEN
      -- Get both students' classes
      SELECT class INTO sender_student_class 
      FROM students 
      WHERE profile_id = sender_id;
      
      SELECT class INTO recipient_student_class 
      FROM students 
      WHERE profile_id = recipient_id;
      
      RETURN sender_student_class = recipient_student_class;
    END IF;
  END IF;
  
  -- Finance can message admin and teachers
  IF sender_role = 'finance' THEN
    IF recipient_role IN ('admin', 'teacher') THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Driver can message admin
  IF sender_role = 'driver' THEN
    IF recipient_role = 'admin' THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for direct_messages

-- Users can view messages where they are sender or recipient
CREATE POLICY "Users can view their messages"
ON public.direct_messages
FOR SELECT
USING (auth.uid() IN (sender_id, recipient_id));

-- Users can send messages only if allowed by role
CREATE POLICY "Users can send messages based on role"
ON public.direct_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND can_message(sender_id, recipient_id)
);

-- Users can update their received messages (mark as read)
CREATE POLICY "Users can update received messages"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Create a view for available contacts based on role
CREATE OR REPLACE VIEW available_contacts AS
SELECT DISTINCT
  p.id,
  p.full_name,
  p.full_name_ar,
  p.email,
  p.role,
  p.phone,
  s.class as student_class,
  t.employee_id as teacher_id
FROM profiles p
LEFT JOIN students s ON s.profile_id = p.id
LEFT JOIN teachers t ON t.profile_id = p.id
WHERE p.id != auth.uid()
  AND can_message(auth.uid(), p.id);

-- Grant access to the view
GRANT SELECT ON available_contacts TO authenticated;

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_direct_messages_updated_at
  BEFORE UPDATE ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();