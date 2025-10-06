-- Fix the can_message function to use correct column names
CREATE OR REPLACE FUNCTION public.can_message(sender_id uuid, recipient_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
        JOIN students s ON s.class::uuid = tc.class_id
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
$function$;