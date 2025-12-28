-- Fix: Allow message recipients to view attachments too (not just the sender/owner)
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their message attachments" ON storage.objects;

-- Create new policy that allows both sender and recipient to view attachments
CREATE POLICY "Users can view message attachments in their conversations" 
ON storage.objects FOR SELECT
USING (
  bucket_id = 'message-attachments' 
  AND (
    -- Owner can always view their own uploads
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Recipients can view attachments from messages sent to them
    EXISTS (
      SELECT 1 FROM public.message_attachments ma
      JOIN public.direct_messages dm ON dm.id = ma.message_id
      WHERE ma.file_url LIKE '%' || name || '%'
      AND (dm.recipient_id = auth.uid() OR dm.sender_id = auth.uid())
    )
  )
);