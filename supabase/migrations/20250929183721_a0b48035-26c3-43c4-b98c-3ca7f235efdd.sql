-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Recreate the policy with proper WITH CHECK clause for INSERT operations
CREATE POLICY "Admins can manage products"
  ON public.products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );