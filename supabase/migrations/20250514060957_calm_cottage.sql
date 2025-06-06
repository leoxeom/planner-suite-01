/*
  # Add Storage Policies for Avatars

  1. Storage Policies
    - Enable authenticated users to manage their own avatars
    - Avatars are stored in user-specific folders based on user ID
    - Public read access for all avatars
*/

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('avatars', 'avatars')
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT TO public
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE TO public
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE TO public
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow public read access to all avatars
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');