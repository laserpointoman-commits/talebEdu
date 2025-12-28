-- Add new columns to direct_messages for WhatsApp-like features
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS is_delivered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.direct_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS forwarded_from_id uuid REFERENCES public.direct_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_deleted_for_sender boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deleted_for_recipient boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_for_everyone boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS voice_duration integer;

-- Create message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create user presence table for online status and typing indicators
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid NOT NULL PRIMARY KEY,
  is_online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT now(),
  typing_to uuid,
  typing_started_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create group_chats table
CREATE TABLE IF NOT EXISTS public.group_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text,
  message_type text DEFAULT 'text',
  reply_to_id uuid REFERENCES public.group_messages(id) ON DELETE SET NULL,
  forwarded_from_id uuid,
  deleted_for_everyone boolean DEFAULT false,
  deleted_at timestamp with time zone,
  voice_duration integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create group_message_read_status table for per-member read receipts
CREATE TABLE IF NOT EXISTS public.group_message_read_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  delivered_at timestamp with time zone,
  read_at timestamp with time zone,
  UNIQUE(message_id, user_id)
);

-- Create group_message_attachments table
CREATE TABLE IF NOT EXISTS public.group_message_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Create group_message_reactions table
CREATE TABLE IF NOT EXISTS public.group_message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create call_logs table for voice/video calls
CREATE TABLE IF NOT EXISTS public.call_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id uuid NOT NULL,
  recipient_id uuid,
  group_id uuid REFERENCES public.group_chats(id) ON DELETE SET NULL,
  call_type text NOT NULL CHECK (call_type IN ('voice', 'video')),
  status text NOT NULL CHECK (status IN ('missed', 'answered', 'declined', 'busy', 'no_answer')),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  duration integer
);

-- Create favorites/starred contacts table
CREATE TABLE IF NOT EXISTS public.favorite_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id)
);

-- Create archived chats table
CREATE TABLE IF NOT EXISTS public.archived_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  contact_id uuid,
  group_id uuid REFERENCES public.group_chats(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions on their messages" ON public.message_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can add reactions" ON public.message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions" ON public.message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_presence
CREATE POLICY "Anyone can view presence" ON public.user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update their presence" ON public.user_presence
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for group_chats
CREATE POLICY "Members can view their groups" ON public.group_chats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create groups" ON public.group_chats
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update groups" ON public.group_chats
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid() AND role = 'admin')
    OR created_by = auth.uid()
  );

-- RLS Policies for group_members
CREATE POLICY "Members can view group members" ON public.group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage members" ON public.group_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
    OR EXISTS (SELECT 1 FROM public.group_chats gc WHERE gc.id = group_id AND gc.created_by = auth.uid())
  );

-- RLS Policies for group_messages
CREATE POLICY "Members can view group messages" ON public.group_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can send messages" ON public.group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Senders can update their messages" ON public.group_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- RLS Policies for group_message_read_status
CREATE POLICY "Members can view read status" ON public.group_message_read_status
  FOR SELECT USING (true);

CREATE POLICY "Users can update their read status" ON public.group_message_read_status
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for group_message_attachments
CREATE POLICY "Members can view attachments" ON public.group_message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_messages gm
      JOIN public.group_members gmem ON gmem.group_id = gm.group_id
      WHERE gm.id = message_id AND gmem.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add attachments" ON public.group_message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_messages gm
      WHERE gm.id = message_id AND gm.sender_id = auth.uid()
    )
  );

-- RLS Policies for group_message_reactions
CREATE POLICY "Members can view reactions" ON public.group_message_reactions
  FOR SELECT USING (true);

CREATE POLICY "Members can add reactions" ON public.group_message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions" ON public.group_message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for call_logs
CREATE POLICY "Users can view their calls" ON public.call_logs
  FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create calls" ON public.call_logs
  FOR INSERT WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Participants can update calls" ON public.call_logs
  FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = recipient_id);

-- RLS Policies for favorite_contacts
CREATE POLICY "Users can view their favorites" ON public.favorite_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their favorites" ON public.favorite_contacts
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for archived_chats
CREATE POLICY "Users can view their archives" ON public.archived_chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their archives" ON public.archived_chats
  FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for new messaging tables (direct_messages is already in realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_message_read_status;