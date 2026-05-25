-- 1. FONCTION DE VERIFICATION DU RATE LIMIT
CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  msg_count integer;
BEGIN
  -- Compter le nombre de messages envoyés par cet utilisateur dans la dernière minute
  SELECT count(*) INTO msg_count
  FROM public.messages
  WHERE sender_id = NEW.sender_id
    AND created_at > now() - interval '1 minute';

  -- Si la limite est dépassée (ex: plus de 6 messages par minute)
  IF msg_count >= 6 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Vous ne pouvez pas envoyer plus de 6 messages par minute. Veuillez patienter.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENREGISTREMENT DU TRIGGER
DROP TRIGGER IF EXISTS trg_check_message_rate_limit ON messages;
CREATE TRIGGER trg_check_message_rate_limit
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION check_message_rate_limit();
