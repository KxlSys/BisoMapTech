/*
  # Expand profile taxonomy + provision avatars storage

  Context
  -------
  The TypeScript `RoleType` already covers 15 values (cybersecurite, sysadmin,
  support, design, hardware, product, enseignement, nocode + the original 7),
  but the database CHECK constraint on `profiles.role_type` only allows the
  original 7 values. As a result, any profile save that picks a "non-web"
  role silently rejects with a CHECK violation, which manifests as "le profil
  ne sauvegarde pas / se réinitialise".

  Avatars
  -------
  The frontend will start uploading custom avatars to Supabase Storage. We
  provision a public-read `avatars` bucket with owner-only writes so a user
  can only manage files inside a folder named after their auth uid.

  1. Profiles
     - Drop and recreate the role_type CHECK constraint to allow all 15
       RoleType values used by the client.

  2. Storage
     - Create the `avatars` bucket (public read).
     - Allow authenticated users to insert/update/delete only their own files
       (folder prefix = auth.uid()).

  3. Idempotency
     - All operations are guarded so re-running the migration is safe.
*/

-- ============================================================
-- 1. Expand role_type CHECK constraint
-- ============================================================

DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'profiles'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%role_type%';

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_type_check
  CHECK (role_type IN (
    'frontend',
    'backend',
    'fullstack',
    'mobile',
    'data',
    'devops',
    'sysadmin',
    'cybersecurite',
    'support',
    'design',
    'hardware',
    'product',
    'enseignement',
    'nocode',
    'autre'
  ));

-- ============================================================
-- 2. Avatars storage bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Public read access (the bucket is already public, but make the policy
-- explicit so that anon/authenticated SELECTs are allowed even if the
-- bucket flag is later revoked).
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Public can read avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

-- Each authenticated user can write inside `avatars/<their uid>/...`.
-- We use `(storage.foldername(name))[1]` which returns the top-level folder.
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
