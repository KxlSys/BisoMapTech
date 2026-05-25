/*
  # Production schema alignment for `profiles`

  Context
  -------
  The earlier migration (20260523234142_create_profiles_and_repositories.sql)
  was never applied against the production database. Production was built
  manually with a normalised model:

      profiles  : id, full_name, email (NOT NULL), city_id (FK→cities),
                  role_type, tech_stack, github_url, linkedin_url,
                  created_at, updated_at
      cities    : id, name, department_id (FK→departments), lat, lng
      departments: id, name

  The application code, however, expects a denormalised, richer profile
  with bio / avatar_url / city (text) / latitude / longitude /
  experience_level / open_to_collaboration / last_seen_at / role / username.
  Every profile insert/select silently fails because of these missing
  columns. This is the root cause behind "le profil se réinitialise" and
  "le formulaire reste bloqué" symptoms.

  Strategy
  --------
  This migration is **idempotent** and **non-destructive**. It:
    1. Ensures `cities` and `departments` exist (CREATE TABLE IF NOT EXISTS)
       and seeds the Congolese reference data, so a freshly cloned dev
       database also has them.
    2. Adds the missing columns on `profiles` with safe defaults — no
       existing data is lost.
    3. Backfills `city`, `latitude`, `longitude` from `cities` via the
       existing `city_id` FK, and conversely populates `city_id` for any
       row that already had a `city` text but no FK.
    4. Generates a `username` from the available data when missing, then
       deduplicates and adds a UNIQUE index.
    5. Relaxes `city_id NOT NULL` (the app authoritatively uses the
       denormalised `city` + lat/lng) and re-applies the role_type CHECK
       with all 15 values used by the client.
    6. Adds CHECKs for `experience_level` and `role`, an `updated_at`
       trigger, and the standard RLS policies.

  Re-running the migration is safe.
*/

-- =============================================================
-- 1. Reference tables
-- =============================================================

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  latitude double precision,
  longitude double precision
);

CREATE UNIQUE INDEX IF NOT EXISTS cities_name_key ON cities(name);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Departments are public" ON departments;
CREATE POLICY "Departments are public"
  ON departments FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Cities are public" ON cities;
CREATE POLICY "Cities are public"
  ON cities FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed departments
INSERT INTO departments (name) VALUES
  ('Brazzaville'),
  ('Pointe-Noire'),
  ('Bouenza'),
  ('Cuvette'),
  ('Cuvette-Ouest'),
  ('Kouilou'),
  ('Lékoumou'),
  ('Likouala'),
  ('Niari'),
  ('Plateaux'),
  ('Pool'),
  ('Sangha'),
  ('Nkéni-Alima'),
  ('Djoué-Léfini'),
  ('Congo-Oubangui')
ON CONFLICT (name) DO NOTHING;

-- Seed cities (Congolese reference list, mirrors src/lib/cities.ts).
-- Lat/lng are upserted only when missing so manually corrected coords
-- aren't overwritten.
INSERT INTO cities (name, latitude, longitude, department_id)
SELECT v.name, v.latitude, v.longitude, d.id
FROM (VALUES
  ('Brazzaville', -4.2634, 15.2429, 'Brazzaville'),
  ('Pointe-Noire', -4.7889, 11.8653, 'Pointe-Noire'),
  ('Dolisie', -4.1995, 12.6667, 'Niari'),
  ('Nkayi', -4.1842, 13.2883, 'Bouenza'),
  ('Ouesso', 1.6136, 16.0517, 'Sangha'),
  ('Mossendjo', -2.9453, 12.7156, 'Niari'),
  ('Sibiti', -3.6833, 13.35, 'Lékoumou'),
  ('Loubomo', -4.1833, 12.6667, 'Niari'),
  ('Madingou', -4.155, 13.55, 'Bouenza'),
  ('Impfondo', 1.6186, 18.0622, 'Likouala'),
  ('Owando', -0.4819, 15.9, 'Cuvette'),
  ('Gamboma', -1.8764, 15.8644, 'Plateaux'),
  ('Oyo', -1.1333, 15.9667, 'Cuvette'),
  ('Boundji', -1.0797, 15.3772, 'Cuvette'),
  ('Makoua', 0.0069, 15.6333, 'Cuvette'),
  ('Ewo', -0.8719, 14.8203, 'Cuvette-Ouest'),
  ('Kindamba', -3.95, 14.75, 'Pool'),
  ('Kinkala', -4.3614, 14.7644, 'Pool'),
  ('Djambala', -2.54, 14.7519, 'Plateaux'),
  ('Loandjili', -4.7578, 11.8578, 'Pointe-Noire'),
  ('Mossaka', -1.2233, 16.7894, 'Cuvette'),
  ('Sembé', 1.6464, 14.58, 'Sangha'),
  ('Souanké', 2.0624, 14.1399, 'Sangha'),
  ('Zanaga', -2.8656, 13.825, 'Lékoumou'),
  ('Odziba', -4.5167, 14.9, 'Djoué-Léfini')
) AS v(name, latitude, longitude, dep_name)
LEFT JOIN departments d ON d.name = v.dep_name
ON CONFLICT (name) DO UPDATE
  SET latitude = COALESCE(cities.latitude, EXCLUDED.latitude),
      longitude = COALESCE(cities.longitude, EXCLUDED.longitude),
      department_id = COALESCE(cities.department_id, EXCLUDED.department_id);

-- =============================================================
-- 2. Profiles — add missing columns
-- =============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS département text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'junior';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_to_collaboration boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'contributor';

-- The app uses the denormalised `city` text as the source of truth for
-- queries and filters. `city_id` stays as a FK but is no longer mandatory
-- so freshly inserted profiles don't need to look it up upfront.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'city_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN city_id DROP NOT NULL;
  END IF;
END $$;

-- =============================================================
-- 3. Backfill from / to cities
-- =============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'city_id'
  ) THEN
    -- city_id → city / latitude / longitude (denormalisation)
    UPDATE profiles p
    SET
      city      = COALESCE(NULLIF(p.city, ''), c.name),
      latitude  = COALESCE(p.latitude, c.latitude),
      longitude = COALESCE(p.longitude, c.longitude)
    FROM cities c
    WHERE p.city_id = c.id
      AND (
        NULLIF(p.city, '') IS NULL
        OR p.latitude IS NULL
        OR p.longitude IS NULL
      );

    -- city text → city_id (back-fill the FK for legacy rows)
    UPDATE profiles p
    SET city_id = c.id
    FROM cities c
    WHERE p.city_id IS NULL
      AND p.city IS NOT NULL
      AND p.city <> ''
      AND lower(c.name) = lower(p.city);
  END IF;
END $$;

-- département from cities/departments via FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'city_id'
  ) THEN
    UPDATE profiles p
    SET département = COALESCE(NULLIF(p.département, ''), d.name)
    FROM cities c
    JOIN departments d ON d.id = c.department_id
    WHERE p.city_id = c.id
      AND NULLIF(p.département, '') IS NULL;
  END IF;
END $$;

-- =============================================================
-- 4. Username — backfill + dedupe + UNIQUE + NOT NULL
-- =============================================================

UPDATE profiles
SET username = sub.candidate
FROM (
  SELECT
    id,
    regexp_replace(
      lower(
        coalesce(
          NULLIF(full_name, ''),
          split_part(coalesce(email, ''), '@', 1),
          'user'
        )
      ),
      '[^a-z0-9]+',
      '_',
      'g'
    ) || '_' || substr(id::text, 1, 6) AS candidate
  FROM profiles
  WHERE username IS NULL OR username = ''
) sub
WHERE profiles.id = sub.id
  AND (profiles.username IS NULL OR profiles.username = '');

-- Deduplicate any colliding usernames before adding the unique index.
WITH duplicates AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY username ORDER BY created_at) AS rn
  FROM profiles
  WHERE username IS NOT NULL
)
UPDATE profiles p
SET username = p.username || '_' || substr(p.id::text, 1, 6)
FROM duplicates d
WHERE p.id = d.id
  AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON profiles(username);

ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;

-- =============================================================
-- 5. CHECK constraints
-- =============================================================

-- role_type — re-create (idempotent) with the 15 values used by the client
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
    'frontend','backend','fullstack','mobile','data','devops',
    'sysadmin','cybersecurite','support','design','hardware',
    'product','enseignement','nocode','autre'
  ));

-- experience_level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_experience_level_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_experience_level_check
      CHECK (experience_level IN ('junior','mid','senior'));
  END IF;
END $$;

-- role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('visitor','contributor','admin'));
  END IF;
END $$;

-- =============================================================
-- 6. updated_at trigger
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- 7. Row Level Security
-- =============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
