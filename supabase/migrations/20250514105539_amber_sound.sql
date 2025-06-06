/*
  # Add Storage Bucket for Organization Logos

  1. Storage
    - Create `logos-organismes` bucket for storing organization logos
    - Set up storage policies for secure access

  2. Security
    - Enable public read access for all logos
    - Restrict upload/delete to regisseur's own folder
*/

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos-organismes', 'logos-organismes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Regisseurs can upload their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Regisseurs can update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Regisseurs can delete their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for logos" ON storage.objects;

-- Create storage policies

-- Allow regisseurs to upload their own logos
CREATE POLICY "Regisseurs can upload their own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos-organismes' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  get_current_user_role() = 'regisseur'
);

-- Allow regisseurs to update their own logos
CREATE POLICY "Regisseurs can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos-organismes' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  get_current_user_role() = 'regisseur'
);

-- Allow regisseurs to delete their own logos
CREATE POLICY "Regisseurs can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos-organismes' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  get_current_user_role() = 'regisseur'
);

-- Allow public read access to all logos
CREATE POLICY "Public read access for logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos-organismes');