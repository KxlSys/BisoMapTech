-- Migration 20260526140000_add_reactions_replies_and_edits.sql

-- ============================================================
-- 1. Ajout des colonnes pour les réponses, modifications et réactions
-- ============================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'::jsonb;

-- ============================================================
-- 2. Mise à jour de la politique de sécurité RLS pour l'édition
-- ============================================================

-- On supprime l'ancienne politique restrictive qui limitait l'UPDATE aux seuls destinataires (pour read_at)
DROP POLICY IF EXISTS "Users can mark received messages as read" ON messages;

-- On crée une nouvelle politique globale d'UPDATE qui autorise l'expéditeur et le destinataire à soumettre des modifications
-- La granularité fine (qui a le droit d'éditer quoi et quand) sera gérée de façon inviolable par le Trigger de base de données.
CREATE POLICY "Users can update messages they participate in"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================================
-- 3. Création du déclencheur (Trigger) de sécurité et d'intégrité
-- ============================================================

CREATE OR REPLACE FUNCTION verify_message_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Si l'utilisateur qui met à jour est uniquement le destinataire (et pas l'expéditeur lui-même)
  IF auth.uid() = OLD.receiver_id AND auth.uid() != OLD.sender_id THEN
    -- Le destinataire N'A PAS le droit de modifier le contenu du message, l'expéditeur, le destinataire, les drapeaux de sécurité, les pièces jointes, la date d'édition ou la citation
    IF NEW.content IS DISTINCT FROM OLD.content OR
       NEW.sender_id IS DISTINCT FROM OLD.sender_id OR
       NEW.receiver_id IS DISTINCT FROM OLD.receiver_id OR
       NEW.is_encrypted IS DISTINCT FROM OLD.is_encrypted OR
       NEW.encryption_iv IS DISTINCT FROM OLD.encryption_iv OR
       NEW.attachment_url IS DISTINCT FROM OLD.attachment_url OR
       NEW.attachment_type IS DISTINCT FROM OLD.attachment_type OR
       NEW.attachment_name IS DISTINCT FROM OLD.attachment_name OR
       NEW.attachment_iv IS DISTINCT FROM OLD.attachment_iv OR
       NEW.attachment_key IS DISTINCT FROM OLD.attachment_key OR
       NEW.reply_to_id IS DISTINCT FROM OLD.reply_to_id OR
       NEW.edited_at IS DISTINCT FROM OLD.edited_at
    THEN
      RAISE EXCEPTION 'Les destinataires ne peuvent modifier que le statut de lecture et les réactions.';
    END IF;
  END IF;

  -- 2. Si l'utilisateur qui met à jour est l'expéditeur
  IF auth.uid() = OLD.sender_id THEN
    -- A. Si le message a été envoyé il y a PLUS d'une heure : interdiction absolue de modifier le contenu ou les fichiers joints
    IF OLD.created_at < (now() - interval '1 hour') THEN
      IF NEW.content IS DISTINCT FROM OLD.content OR
         NEW.is_encrypted IS DISTINCT FROM OLD.is_encrypted OR
         NEW.encryption_iv IS DISTINCT FROM OLD.encryption_iv OR
         NEW.attachment_url IS DISTINCT FROM OLD.attachment_url OR
         NEW.attachment_type IS DISTINCT FROM OLD.attachment_type OR
         NEW.attachment_name IS DISTINCT FROM OLD.attachment_name OR
         NEW.attachment_iv IS DISTINCT FROM OLD.attachment_iv OR
         NEW.attachment_key IS DISTINCT FROM OLD.attachment_key OR
         NEW.reply_to_id IS DISTINCT FROM OLD.reply_to_id OR
         NEW.edited_at IS DISTINCT FROM OLD.edited_at
      THEN
        RAISE EXCEPTION 'Impossible de modifier le contenu d''un message après 1 heure. Seules les réactions sont autorisées.';
      END IF;
    END IF;

    -- B. Si la modification a lieu sous moins d'une heure : on autorise la modification de texte/fichiers
    -- et on enregistre automatiquement la date de mise à jour dans `edited_at`
    IF OLD.created_at >= (now() - interval '1 hour') THEN
      IF NEW.content IS DISTINCT FROM OLD.content OR
         NEW.attachment_url IS DISTINCT FROM OLD.attachment_url
      THEN
        NEW.edited_at := now();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suppression et recréation propre du trigger
DROP TRIGGER IF EXISTS check_message_update_integrity ON messages;
CREATE TRIGGER check_message_update_integrity
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION verify_message_update();
