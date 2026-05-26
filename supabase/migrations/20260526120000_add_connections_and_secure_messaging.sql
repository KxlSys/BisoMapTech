/*
  # Connexions (mise en relation) + messagerie sécurisée

  Met en place une couche de "demande de connexion" : deux membres doivent être
  connectés (demande -> acceptation) avant de pouvoir échanger des messages.

  1. Nouvelle table `connections`
     - requester_id / addressee_id (FK profiles)
     - status: 'pending' | 'accepted'
     - une seule ligne par paire (quel que soit le sens)

  2. RLS
     - seuls les participants voient/gèrent leur ligne
     - seul le destinataire peut accepter (transition contrôlée par trigger)

  3. Messagerie sécurisée
     - l'INSERT de message exige une connexion ACCEPTÉE entre les deux membres
     - longueur du contenu bornée (1..4000)

  4. Temps réel
     - `messages` et `connections` ajoutées à la publication supabase_realtime
*/

-- ============================================================
-- 1. Table connections
-- ============================================================
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connections_no_self CHECK (requester_id <> addressee_id)
);

-- Une seule relation par paire non ordonnée (empêche A->B et B->A en double).
CREATE UNIQUE INDEX IF NOT EXISTS connections_unique_pair
  ON connections (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

CREATE INDEX IF NOT EXISTS idx_connections_addressee
  ON connections (addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_requester
  ON connections (requester_id, status);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement les deux participants
DROP POLICY IF EXISTS "Participants can view their connections" ON connections;
CREATE POLICY "Participants can view their connections"
  ON connections FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Création : on ne peut émettre qu'une demande 'pending' dont on est l'auteur
DROP POLICY IF EXISTS "Users can request a connection" ON connections;
CREATE POLICY "Users can request a connection"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- Mise à jour : réservée aux participants (transitions validées par trigger)
DROP POLICY IF EXISTS "Participants can update their connection" ON connections;
CREATE POLICY "Participants can update their connection"
  ON connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Suppression : un participant peut retirer la relation
-- (refuser une demande, annuler sa demande, se déconnecter)
DROP POLICY IF EXISTS "Participants can delete their connection" ON connections;
CREATE POLICY "Participants can delete their connection"
  ON connections FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ============================================================
-- 2. Contrôle des transitions de statut
--    - seul 'pending' -> 'accepted' est permis
--    - seul le destinataire peut accepter
--    - les participants sont immuables
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_connection_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    IF NOT (OLD.status = 'pending' AND NEW.status = 'accepted') THEN
      RAISE EXCEPTION 'Transition de statut non autorisée (% -> %)', OLD.status, NEW.status;
    END IF;
    IF auth.uid() <> OLD.addressee_id THEN
      RAISE EXCEPTION 'Seul le destinataire peut accepter la demande de connexion';
    END IF;
  END IF;

  IF NEW.requester_id <> OLD.requester_id OR NEW.addressee_id <> OLD.addressee_id THEN
    RAISE EXCEPTION 'Les participants d''une connexion sont immuables';
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_connection_transition ON connections;
CREATE TRIGGER trg_connection_transition
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION enforce_connection_transition();

-- ============================================================
-- 3. Messagerie sécurisée
-- ============================================================

-- Helper SECURITY DEFINER : deux membres sont-ils connectés (accepté) ?
-- Contourne proprement la RLS de `connections` pour être utilisable dans la
-- policy d'INSERT des messages sans dépendance circulaire.
CREATE OR REPLACE FUNCTION are_connected(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM connections c
    WHERE c.status = 'accepted'
      AND (
        (c.requester_id = user_a AND c.addressee_id = user_b)
        OR (c.requester_id = user_b AND c.addressee_id = user_a)
      )
  );
$$;

-- On ne peut envoyer un message qu'à une connexion ACCEPTÉE.
DROP POLICY IF EXISTS "Users can send messages as themselves" ON messages;
DROP POLICY IF EXISTS "Users can message accepted connections" ON messages;
CREATE POLICY "Users can message accepted connections"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND are_connected(sender_id, receiver_id)
  );

-- Borne la longueur du contenu (NOT VALID : n'invalide pas d'éventuelles
-- lignes vides historiques, mais s'applique à tout nouvel INSERT/UPDATE).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_content_length'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_content_length
      CHECK (char_length(content) BETWEEN 1 AND 4000) NOT VALID;
  END IF;
END $$;

-- ============================================================
-- 4. Temps réel : enregistrer les tables dans la publication
-- ============================================================
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE connections REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'connections'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE connections;
    END IF;
  END IF;
END $$;
