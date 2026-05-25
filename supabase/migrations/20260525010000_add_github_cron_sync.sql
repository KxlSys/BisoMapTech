-- 1. ENABLER LES EXTENSIONS NECESSAIRES
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. CRÉATION DE LA PROCÉDURE DE SYNCHRONISATION
CREATE OR REPLACE FUNCTION public.cron_sync_all_github_repos()
RETURNS void AS $$
DECLARE
  profile_row RECORD;
  github_username text;
  supabase_url text;
  service_role_key text;
BEGIN
  -- Récupérer l'URL et la clé de service depuis les paramètres de configuration Supabase
  -- Note: Dans Supabase, ces variables sont généralement accessibles via CURRENT_SETTING
  supabase_url := 'https://' || current_setting('request.headers', true)::json->>'host';
  
  -- Si l'URL n'est pas détectable dynamiquement, on peut utiliser localhost pour les requêtes réseau internes
  IF supabase_url IS NULL OR supabase_url = 'https://' THEN
    -- Remplacer par l'URL réelle de ton projet en production si nécessaire
    supabase_url := 'https://lffxlprufodaijlxxgrq.supabase.co'; 
  END IF;

  -- Boucler sur tous les profils qui ont une URL GitHub configurée
  FOR profile_row IN 
    SELECT id, github_url 
    FROM public.profiles 
    WHERE github_url IS NOT NULL 
      AND github_url <> ''
  LOOP
    -- Extraire le nom d'utilisateur de l'URL github (ex: https://github.com/jmokili -> jmokili)
    github_username := regexp_replace(profile_row.github_url, '^https?://github\.com/([^/]+)/?.*$', '\1');

    IF github_username IS NOT NULL AND github_username <> '' THEN
      -- Déclencher l'appel HTTP asynchrone vers l'Edge Function sync-github-repos
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/sync-github-repos',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          -- Utilise la clé de service configurée dans l'environnement de la DB pour s'authentifier de manière sécurisée
          'Authorization', 'Bearer ' || COALESCE(current_setting('private.service_role_key', true), '')
        ),
        body := jsonb_build_object(
          'username', github_username,
          'profile_id', profile_row.id
        ),
        timeout_milliseconds := 15000
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PLANIFICATION DU CRON (Chaque jour à minuit)
-- Annuler la planification existante uniquement si elle existe pour éviter l'erreur XX000
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-github-repos-daily') THEN
    PERFORM cron.unschedule('sync-github-repos-daily');
  END IF;
END;
$$;

-- Programmer la tâche pour tourner tous les jours à 00:00 (Minuit)
SELECT cron.schedule(
  'sync-github-repos-daily', -- Identifiant unique
  '0 0 * * *',               -- Cron syntax (Tous les jours à minuit)
  'SELECT public.cron_sync_all_github_repos();'
);
