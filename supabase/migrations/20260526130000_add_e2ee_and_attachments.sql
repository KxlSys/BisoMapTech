/*
  # Ajout du Chiffrement de Bout en Bout (E2EE) et du partage Multimédia

  1. Nouvelle colonne dans `profiles` :
     - `e2ee_public_key` : Stocke la clé publique ECDH (format JWK JSON) de l'utilisateur.

  2. Nouvelles colonnes dans `messages` :
     - `is_encrypted` : Indicateur si le texte du message est chiffré de bout en bout.
     - `encryption_iv` : Vecteur d'initialisation pour déchiffrer le message chiffré.
     - `attachment_url` : Lien vers le fichier multimédia chiffré (photo, PDF, note vocale) dans Supabase Storage.
     - `attachment_type` : Type de pièce jointe ('image', 'pdf', 'voice').
     - `attachment_name` : Nom du fichier d'origine.
     - `attachment_iv` : Vecteur d'initialisation pour déchiffrer le fichier chiffré.
     - `attachment_key` : Clé AES locale enveloppée (chiffrée avec la clé publique du destinataire).

  3. Nouveau bucket de stockage :
     - `message-attachments` : Bucket de stockage public pour héberger les fichiers cryptés.
     - RLS sur le bucket pour autoriser la lecture et l'écriture uniquement aux utilisateurs authentifiés.
*/

-- ============================================================
-- 1. Ajout de la clé publique E2EE dans les profils
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS e2ee_public_key text;

-- ============================================================
-- 2. Ajout des colonnes de chiffrement et multimédia dans messages
-- ============================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encryption_iv text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type text CHECK (attachment_type IN ('image', 'pdf', 'voice'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_iv text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_key text;

-- ============================================================
-- 3. Configuration du Stockage des Pièces Jointes
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Politique de lecture : tous les membres connectés peuvent télécharger les pièces jointes
-- (rappel : les fichiers sont chiffrés de bout en bout en local avant d'être envoyés)
DROP POLICY IF EXISTS "Authenticated users can read attachments" ON storage.objects;
CREATE POLICY "Authenticated users can read attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'message-attachments');

-- Politique d'insertion : les membres connectés peuvent envoyer des fichiers
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique de suppression : seul l'utilisateur propriétaire peut supprimer sa pièce jointe
DROP POLICY IF EXISTS "Owners can delete their own attachments" ON storage.objects;
CREATE POLICY "Owners can delete their own attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
