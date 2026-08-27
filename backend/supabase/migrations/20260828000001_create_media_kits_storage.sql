-- ═══════════════════════════════════════════════════════════
-- GINGER — Create Supabase Storage Bucket for Media Kits & Documents
-- ═══════════════════════════════════════════════════════════

-- Create public storage bucket for media kits
INSERT INTO storage.buckets (id, name, public)
VALUES ('media_kits', 'media_kits', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Allow public read access to media_kits bucket
DROP POLICY IF EXISTS "Public Media Kits Read Access" ON storage.objects;
CREATE POLICY "Public Media Kits Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media_kits');

-- Policy: Allow authenticated users to upload to media_kits bucket
DROP POLICY IF EXISTS "Authenticated Users Media Kits Upload" ON storage.objects;
CREATE POLICY "Authenticated Users Media Kits Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media_kits');

-- Policy: Allow users to update their own uploads in media_kits bucket
DROP POLICY IF EXISTS "Users Can Update Own Media Kits" ON storage.objects;
CREATE POLICY "Users Can Update Own Media Kits"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media_kits' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Allow users to delete their own uploads in media_kits bucket
DROP POLICY IF EXISTS "Users Can Delete Own Media Kits" ON storage.objects;
CREATE POLICY "Users Can Delete Own Media Kits"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media_kits' AND (storage.foldername(name))[1] = auth.uid()::text);
