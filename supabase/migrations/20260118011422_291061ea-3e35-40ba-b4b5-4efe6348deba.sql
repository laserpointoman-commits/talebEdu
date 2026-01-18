-- Create storage bucket for group images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('group-images', 'group-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload group images
CREATE POLICY "Authenticated users can upload group images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'group-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Anyone can view group images (public bucket)
CREATE POLICY "Public can view group images"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-images');

-- Policy: Group creators and admins can update group images
CREATE POLICY "Users can update group images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'group-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Group creators and admins can delete group images
CREATE POLICY "Users can delete group images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'group-images' 
  AND auth.role() = 'authenticated'
);