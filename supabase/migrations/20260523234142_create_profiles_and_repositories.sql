/*
  # Create profiles and repositories tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, FK to auth.users)
      - `username` (text, unique) - GitHub username
      - `full_name` (text) - Display name
      - `avatar_url` (text) - Profile photo URL
      - `bio` (text) - Short bio
      - `city` (text) - City in Congo
      - `latitude` (float8) - GPS latitude
      - `longitude` (float8) - GPS longitude
      - `github_url` (text) - GitHub profile URL
      - `tech_stack` (text[]) - Array of technologies
      - `role_type` (text) - frontend/backend/fullstack/data/devops/mobile/autre
      - `experience_level` (text) - junior/mid/senior
      - `open_to_collaboration` (boolean) - Availability flag
      - `role` (text) - visitor/contributor/admin
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `repositories`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, FK to profiles)
      - `name` (text) - Repo name
      - `description` (text) - Repo description
      - `language` (text) - Primary language
      - `stars` (integer) - Star count
      - `url` (text) - Repo URL
      - `is_pinned` (boolean) - Whether pinned on profile
    - `admin_invitations`
      - `id` (uuid, primary key)
      - `invited_by` (uuid, FK to profiles)
      - `invited_email` (text) - Email to invite
      - `status` (text) - pending/accepted/expired
      - `token` (uuid, unique) - Invitation token
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for profiles and repositories
    - Authenticated users can update their own profile
    - Admins can manage all profiles and invitations

  3. Indexes
    - GIN index on tech_stack for array searches
    - Index on city and role_type for filtering
    - Index on role for admin lookups
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  city text DEFAULT '',
  latitude float8 DEFAULT 0,
  longitude float8 DEFAULT 0,
  github_url text DEFAULT '',
  tech_stack text[] DEFAULT '{}',
  role_type text DEFAULT 'fullstack' CHECK (role_type IN ('frontend', 'backend', 'fullstack', 'data', 'devops', 'mobile', 'autre')),
  experience_level text DEFAULT 'junior' CHECK (experience_level IN ('junior', 'mid', 'senior')),
  open_to_collaboration boolean DEFAULT true,
  role text DEFAULT 'contributor' CHECK (role IN ('visitor', 'contributor', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_role_type ON profiles(role_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_tech_stack ON profiles USING GIN(tech_stack);

-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  language text DEFAULT '',
  stars integer DEFAULT 0,
  url text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view repositories"
  ON repositories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can manage their own repos
CREATE POLICY "Users can insert own repositories"
  ON repositories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = profile_id AND id = auth.uid()
    )
  );

CREATE POLICY "Users can update own repositories"
  ON repositories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = profile_id AND id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = profile_id AND id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own repositories"
  ON repositories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = profile_id AND id = auth.uid()
    )
  );

-- Admin invitations table
CREATE TABLE IF NOT EXISTS admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token uuid UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can view invitations
CREATE POLICY "Admins can view invitations"
  ON admin_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON admin_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update invitations
CREATE POLICY "Admins can update invitations"
  ON admin_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
