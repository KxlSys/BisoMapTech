-- Ajoute les colonnes de sauvegarde E2EE (Zero-Knowledge) dans la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS e2ee_encrypted_private_key text,
ADD COLUMN IF NOT EXISTS e2ee_private_key_salt text;

-- S'assurer que les colonnes sont modifiables par l'utilisateur lui-même (via RLS)
-- La table profiles possède déjà des règles UPDATE basées sur auth.uid() = id,
-- ces colonnes en héritent naturellement.
