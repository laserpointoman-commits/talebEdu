-- Add DELETE policy for admins on pending_parent_registrations
CREATE POLICY "Admins can delete registration tokens" 
ON public.pending_parent_registrations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);