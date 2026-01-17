-- Fix Messenger Groups: remove recursive RLS policies and replace with SECURITY DEFINER helpers

-- 1) Helper functions (avoid RLS recursion by checking membership as table owner)
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = p_user_id
      AND gm.role = 'admin'
  );
$$;

-- 2) Ensure RLS is enabled
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- 3) Drop broken policies (they currently cause infinite recursion)
DROP POLICY IF EXISTS "Members can view their groups" ON public.group_chats;
DROP POLICY IF EXISTS "Admins can update groups" ON public.group_chats;
DROP POLICY IF EXISTS "Users can create groups" ON public.group_chats;

DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.group_members;

DROP POLICY IF EXISTS "Members can view group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Senders can update their messages" ON public.group_messages;

-- 4) Recreate correct, non-recursive policies
-- group_chats
CREATE POLICY "Users can create groups"
ON public.group_chats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view their groups"
ON public.group_chats
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_group_member(id, auth.uid())
);

CREATE POLICY "Admins can update groups"
ON public.group_chats
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_group_admin(id, auth.uid())
)
WITH CHECK (
  created_by = auth.uid()
  OR public.is_group_admin(id, auth.uid())
);

-- group_members
CREATE POLICY "Members can view group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  public.is_group_member(group_id, auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.group_chats gc
    WHERE gc.id = group_id
      AND gc.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can manage members"
ON public.group_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_chats gc
    WHERE gc.id = group_id
      AND gc.created_by = auth.uid()
  )
  OR public.is_group_admin(group_id, auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.group_chats gc
    WHERE gc.id = group_id
      AND gc.created_by = auth.uid()
  )
  OR public.is_group_admin(group_id, auth.uid())
);

-- group_messages
CREATE POLICY "Members can view group messages"
ON public.group_messages
FOR SELECT
TO authenticated
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can send messages"
ON public.group_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "Senders can update their messages"
ON public.group_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- 5) Performance indexes (safe / non-breaking)
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON public.group_members (group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created ON public.group_messages (group_id, created_at);
