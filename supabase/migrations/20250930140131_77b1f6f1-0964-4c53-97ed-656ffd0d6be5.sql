-- Create social platform tables for students

-- Friend requests table
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Friendships table (bidirectional)
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student1_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student2_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_friendship UNIQUE(student1_id, student2_id),
  CONSTRAINT no_self_friendship CHECK (student1_id != student2_id)
);

-- Posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('friends', 'class')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, student_id)
);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conversation participants
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, student_id)
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX idx_friendships_student1 ON public.friendships(student1_id);
CREATE INDEX idx_friendships_student2 ON public.friendships(student2_id);
CREATE INDEX idx_posts_student ON public.posts(student_id);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post ON public.post_comments(post_id);
CREATE INDEX idx_likes_post ON public.post_likes(post_id);
CREATE INDEX idx_conversation_participants_student ON public.conversation_participants(student_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_requests
CREATE POLICY "Students can view their friend requests"
ON public.friend_requests FOR SELECT
USING (
  sender_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()) OR
  receiver_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);

CREATE POLICY "Students can send friend requests to same class"
ON public.friend_requests FOR INSERT
WITH CHECK (
  sender_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()) AND
  receiver_id IN (
    SELECT s2.id FROM public.students s1
    JOIN public.students s2 ON s1.class = s2.class
    WHERE s1.profile_id = auth.uid() AND s2.id != s1.id
  )
);

CREATE POLICY "Students can update their friend requests"
ON public.friend_requests FOR UPDATE
USING (
  receiver_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);

-- RLS Policies for friendships
CREATE POLICY "Students can view their friendships"
ON public.friendships FOR SELECT
USING (
  student1_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()) OR
  student2_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);

CREATE POLICY "System can manage friendships"
ON public.friendships FOR ALL
USING (true);

-- RLS Policies for posts
CREATE POLICY "Students can view posts from friends and same class"
ON public.posts FOR SELECT
USING (
  student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()) OR
  (visibility = 'friends' AND student_id IN (
    SELECT CASE 
      WHEN student1_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()) THEN student2_id
      ELSE student1_id 
    END
    FROM public.friendships
    WHERE student1_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()) OR
          student2_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
  )) OR
  (visibility = 'class' AND student_id IN (
    SELECT s2.id FROM public.students s1
    JOIN public.students s2 ON s1.class = s2.class
    WHERE s1.profile_id = auth.uid()
  ))
);

CREATE POLICY "Students can create their own posts"
ON public.posts FOR INSERT
WITH CHECK (
  student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);

CREATE POLICY "Students can update their own posts"
ON public.posts FOR UPDATE
USING (
  student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);

CREATE POLICY "Students can delete their own posts"
ON public.posts FOR DELETE
USING (
  student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);

-- RLS Policies for post_comments
CREATE POLICY "Students can view comments on visible posts"
ON public.post_comments FOR SELECT
USING (
  post_id IN (SELECT id FROM public.posts)
);

CREATE POLICY "Students can comment on visible posts"
ON public.post_comments FOR INSERT
WITH CHECK (
  student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()) AND
  post_id IN (SELECT id FROM public.posts)
);

CREATE POLICY "Students can update their own comments"
ON public.post_comments FOR UPDATE
USING (
  student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);

CREATE POLICY "Students can delete their own comments"
ON public.post_comments FOR DELETE
USING (
  student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);

-- RLS Policies for post_likes
CREATE POLICY "Students can view likes"
ON public.post_likes FOR SELECT
USING (true);

CREATE POLICY "Students can like posts"
ON public.post_likes FOR INSERT
WITH CHECK (
  student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()) AND
  post_id IN (SELECT id FROM public.posts)
);

CREATE POLICY "Students can unlike posts"
ON public.post_likes FOR DELETE
USING (
  student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);

-- RLS Policies for conversations
CREATE POLICY "Students can view their conversations"
ON public.conversations FOR SELECT
USING (
  id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "System can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (true);

-- RLS Policies for conversation_participants
CREATE POLICY "Students can view their conversation participants"
ON public.conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "System can manage participants"
ON public.conversation_participants FOR ALL
USING (true);

-- RLS Policies for chat_messages
CREATE POLICY "Students can view messages in their conversations"
ON public.chat_messages FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Students can send messages to their conversations"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()) AND
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
  )
);

-- Function to handle friend request acceptance
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID;
  v_receiver_id UUID;
BEGIN
  -- Get request details
  SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
  FROM friend_requests
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE friend_requests SET status = 'accepted', updated_at = now()
  WHERE id = request_id;
  
  -- Create friendship (ensure lower ID is first for consistency)
  INSERT INTO friendships (student1_id, student2_id)
  VALUES (
    LEAST(v_sender_id, v_receiver_id),
    GREATEST(v_sender_id, v_receiver_id)
  )
  ON CONFLICT (student1_id, student2_id) DO NOTHING;
  
  -- Create conversation for the new friends
  WITH new_conversation AS (
    INSERT INTO conversations DEFAULT VALUES
    RETURNING id
  )
  INSERT INTO conversation_participants (conversation_id, student_id)
  SELECT new_conversation.id, student_id
  FROM new_conversation, (VALUES (v_sender_id), (v_receiver_id)) AS students(student_id);
  
  RETURN TRUE;
END;
$$;

-- Function to get or create conversation between two students
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_student_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_current_student_id UUID;
BEGIN
  -- Get current student ID
  SELECT id INTO v_current_student_id
  FROM students WHERE profile_id = auth.uid();
  
  -- Check if conversation exists
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.student_id = v_current_student_id
    AND cp2.student_id = other_student_id
    AND cp1.conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      GROUP BY conversation_id 
      HAVING COUNT(*) = 2
    )
  LIMIT 1;
  
  IF v_conversation_id IS NULL THEN
    -- Create new conversation
    INSERT INTO conversations DEFAULT VALUES
    RETURNING id INTO v_conversation_id;
    
    -- Add participants
    INSERT INTO conversation_participants (conversation_id, student_id)
    VALUES 
      (v_conversation_id, v_current_student_id),
      (v_conversation_id, other_student_id);
  END IF;
  
  RETURN v_conversation_id;
END;
$$;