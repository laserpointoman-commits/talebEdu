-- Fix: allow delete-for-everyone trigger to null out content
-- The trigger public.enforce_direct_messages_update() sets NEW.content := NULL when deleted_for_everyone becomes TRUE.
-- direct_messages.content is currently NOT NULL, which causes error 23502.
ALTER TABLE public.direct_messages
  ALTER COLUMN content DROP NOT NULL;