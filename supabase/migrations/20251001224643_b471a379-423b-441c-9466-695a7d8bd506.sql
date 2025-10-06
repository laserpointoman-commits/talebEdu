-- Create a junction table for teacher-class assignments
CREATE TABLE IF NOT EXISTS teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);

-- Enable RLS
ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_classes
CREATE POLICY "Teachers can view their own class assignments" 
ON teacher_classes FOR SELECT 
USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE profile_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage teacher class assignments" 
ON teacher_classes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add medical_info and parent_phone to students table if not exists
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS medical_info TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- Create message_attachments table for file/image sharing
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_attachments
CREATE POLICY "Users can view attachments in their messages" 
ON message_attachments FOR SELECT 
USING (
  message_id IN (
    SELECT id FROM direct_messages 
    WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
  )
);

CREATE POLICY "Users can add attachments to their messages" 
ON message_attachments FOR INSERT 
WITH CHECK (
  message_id IN (
    SELECT id FROM direct_messages WHERE sender_id = auth.uid()
  )
);

-- Create a storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message attachments
CREATE POLICY "Users can upload message attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'message-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their message attachments" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'message-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their message attachments" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'message-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update the can_message function to handle teacher-student messaging
CREATE OR REPLACE FUNCTION public.can_message(sender_id uuid, recipient_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_role user_role;
  recipient_role user_role;
  has_common_class BOOLEAN;
BEGIN
  -- Get roles
  SELECT role INTO sender_role FROM profiles WHERE id = sender_id;
  SELECT role INTO recipient_role FROM profiles WHERE id = recipient_id;
  
  -- Admin can message anyone
  IF sender_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Teachers can message students in their classes
  IF sender_role = 'teacher' THEN
    IF recipient_role = 'student' THEN
      -- Check if teacher teaches the student's class
      SELECT EXISTS(
        SELECT 1 
        FROM teacher_classes tc
        JOIN teachers t ON t.id = tc.teacher_id
        JOIN students s ON s.class_id = tc.class_id::text
        WHERE t.profile_id = sender_id 
        AND s.profile_id = recipient_id
      ) INTO has_common_class;
      
      RETURN has_common_class;
    END IF;
    
    -- Teachers can message other teachers and admin
    IF recipient_role IN ('teacher', 'admin', 'finance') THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Parents can message admin and their children's teachers
  IF sender_role = 'parent' THEN
    IF recipient_role = 'admin' THEN
      RETURN TRUE;
    END IF;
    
    IF recipient_role = 'teacher' THEN
      -- Check if teacher teaches any of parent's children
      SELECT EXISTS(
        SELECT 1 
        FROM students s
        JOIN teacher_classes tc ON tc.class_id::text = s.class
        JOIN teachers t ON t.id = tc.teacher_id
        WHERE s.parent_id = sender_id 
        AND t.profile_id = recipient_id
      ) INTO has_common_class;
      
      RETURN has_common_class;
    END IF;
  END IF;
  
  -- Students can message students in their class
  IF sender_role = 'student' AND recipient_role = 'student' THEN
    SELECT EXISTS(
      SELECT 1 
      FROM students s1, students s2
      WHERE s1.profile_id = sender_id 
      AND s2.profile_id = recipient_id
      AND s1.class = s2.class
    ) INTO has_common_class;
    
    RETURN has_common_class;
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
$$;