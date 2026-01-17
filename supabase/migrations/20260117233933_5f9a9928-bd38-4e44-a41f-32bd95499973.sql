-- Create pinned_chats table for persistent pin state
CREATE TABLE IF NOT EXISTS public.pinned_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid,
  group_id uuid REFERENCES public.group_chats(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id),
  UNIQUE(user_id, group_id),
  CHECK (contact_id IS NOT NULL OR group_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.pinned_chats ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their pins"
ON public.pinned_chats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their pins"
ON public.pinned_chats
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also add unique constraint to archived_chats if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'archived_chats_user_id_contact_id_key'
  ) THEN
    ALTER TABLE public.archived_chats ADD CONSTRAINT archived_chats_user_id_contact_id_key UNIQUE(user_id, contact_id);
  END IF;
END $$;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_pinned_chats_user ON public.pinned_chats (user_id);
CREATE INDEX IF NOT EXISTS idx_archived_chats_user ON public.archived_chats (user_id);