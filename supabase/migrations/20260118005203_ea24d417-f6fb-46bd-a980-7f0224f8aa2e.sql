-- Allow senders to persist delete flags, while keeping updates safe

-- 1) Replace UPDATE policies on direct_messages
DROP POLICY IF EXISTS "Users can update received messages" ON public.direct_messages;

CREATE POLICY "Users can update received messages"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update sent messages"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = sender_id);

-- 2) Enforce column-level intent via trigger (RLS can't restrict columns)
CREATE OR REPLACE FUNCTION public.enforce_direct_messages_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only sender or recipient can ever update
  IF actor <> OLD.sender_id AND actor <> OLD.recipient_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  -- Prevent changing immutable identity fields
  IF NEW.id <> OLD.id
     OR NEW.sender_id <> OLD.sender_id
     OR NEW.recipient_id <> OLD.recipient_id
     OR NEW.created_at <> OLD.created_at
  THEN
    RAISE EXCEPTION 'Immutable fields cannot be changed';
  END IF;

  -- Sender-side updates (delete flags)
  IF actor = OLD.sender_id THEN
    -- Sender cannot edit content (except when deleting for everyone)
    IF (NEW.content IS DISTINCT FROM OLD.content)
       AND NOT (OLD.deleted_for_everyone IS DISTINCT FROM TRUE AND NEW.deleted_for_everyone = TRUE)
    THEN
      RAISE EXCEPTION 'Sender cannot edit message content';
    END IF;

    -- Sender can set delete-for-me flag (only false -> true)
    IF NEW.is_deleted_for_sender IS DISTINCT FROM OLD.is_deleted_for_sender THEN
      IF OLD.is_deleted_for_sender = TRUE AND NEW.is_deleted_for_sender = FALSE THEN
        RAISE EXCEPTION 'Cannot undelete';
      END IF;
    END IF;

    -- Sender can delete for everyone (only false -> true)
    IF NEW.deleted_for_everyone IS DISTINCT FROM OLD.deleted_for_everyone THEN
      IF OLD.deleted_for_everyone = TRUE AND NEW.deleted_for_everyone = FALSE THEN
        RAISE EXCEPTION 'Cannot undelete for everyone';
      END IF;

      IF NEW.deleted_for_everyone = TRUE THEN
        NEW.deleted_at := COALESCE(NEW.deleted_at, now());
        NEW.content := NULL;
      END IF;
    END IF;

    -- Sender cannot touch recipient-only fields
    IF NEW.is_read IS DISTINCT FROM OLD.is_read
       OR NEW.read_at IS DISTINCT FROM OLD.read_at
       OR NEW.is_delivered IS DISTINCT FROM OLD.is_delivered
       OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at
       OR NEW.is_deleted_for_recipient IS DISTINCT FROM OLD.is_deleted_for_recipient
    THEN
      RAISE EXCEPTION 'Sender cannot update recipient-only fields';
    END IF;

    RETURN NEW;
  END IF;

  -- Recipient-side updates (read/delivered/delete-for-me)
  IF actor = OLD.recipient_id THEN
    -- Recipient cannot edit content
    IF NEW.content IS DISTINCT FROM OLD.content THEN
      RAISE EXCEPTION 'Recipient cannot edit message content';
    END IF;

    -- Recipient can set delete-for-me flag (only false -> true)
    IF NEW.is_deleted_for_recipient IS DISTINCT FROM OLD.is_deleted_for_recipient THEN
      IF OLD.is_deleted_for_recipient = TRUE AND NEW.is_deleted_for_recipient = FALSE THEN
        RAISE EXCEPTION 'Cannot undelete';
      END IF;
    END IF;

    -- Recipient cannot touch sender-only fields
    IF NEW.is_deleted_for_sender IS DISTINCT FROM OLD.is_deleted_for_sender
       OR NEW.deleted_for_everyone IS DISTINCT FROM OLD.deleted_for_everyone
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
    THEN
      RAISE EXCEPTION 'Recipient cannot update sender-only fields';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_direct_messages_update ON public.direct_messages;
CREATE TRIGGER enforce_direct_messages_update
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_direct_messages_update();
