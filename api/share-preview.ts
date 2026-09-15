import {
  DEFAULT_META,
  buildProfileMeta,
  renderMetaDocument,
  type ProfileMetaInput,
} from "../src/lib/page-meta";

// ======================================================
// APERÇUS DE PARTAGE POUR LES ROBOTS
// ------------------------------------------------------
// WhatsApp, Facebook, Telegram et les moteurs lisent le HTML renvoyé par le
// serveur sans exécuter JavaScript. Une application monopage leur sert donc
// toujours les mêmes balises, et un profil partagé s'affiche avec le titre
// générique du site. Cette fonction répond à ces robots seuls : le routage
// (voir `vercel.json`) ne l'atteint que sur un `User-Agent` reconnu, les
// visiteurs humains reçoivent l'application normalement.
// ======================================================

export const config = { runtime: "edge" };

// La lecture se fait avec la clé publique (« anon »), comme le navigateur.
// C'est la politique RLS de la table `profiles` qui décide de ce qui sort :
// `Anyone can view profiles ... USING (true)` en lecture seule, sur une table
// qui ne contient que des champs d'annuaire public (ni e-mail, ni téléphone,
// ni donnée d'authentification). Cette fonction n'expose donc rien de plus que
// ce que l'application sert déjà côté navigateur. Toute colonne sensible
// ajoutée un jour à `profiles` devra être protégée par une politique dédiée,
// ici comme dans l'application.
//
// La chaîne de repli des noms de variables suit `.env.example` et
// `src/lib/supabase.ts` : selon l'âge du projet Supabase, la clé publique
// s'appelle « anon » ou « publishable ».
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

const PROFILE_FIELDS =
  "username,full_name,role_type,city,bio,avatar_url,tech_stack";

/** Le robot attend quelques centaines de millisecondes, pas davantage. */
const FETCH_TIMEOUT_MS = 2500;

async function fetchProfile(username: string): Promise<ProfileMetaInput | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  const endpoint =
    `${SUPABASE_URL}/rest/v1/profiles` +
    `?username=eq.${encodeURIComponent(username)}` +
    `&select=${PROFILE_FIELDS}&limit=1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      headers: {
        // Les deux en-têtes sont nécessaires : `apikey` identifie le projet
        // auprès de la passerelle, `Authorization` fixe le rôle Postgres
        // utilisé par PostgREST. C'est ce que supabase-js envoie lui-même.
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const rows = (await response.json()) as ProfileMetaInput[];
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch {
    // Base injoignable ou délai dépassé : on retombe sur l'aperçu du site,
    // ce qui vaut mieux qu'un lien sans aperçu du tout.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const username = (url.searchParams.get("u") || "").trim();

  const profile = username ? await fetchProfile(username) : null;
  const meta = profile ? buildProfileMeta(profile) : DEFAULT_META;

  return new Response(renderMetaDocument(meta), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Un profil bouge rarement, et un robot repasse souvent sur le même lien.
      "Cache-Control": profile
        ? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
        : "public, max-age=60, s-maxage=60",
      "X-Robots-Tag": "all",
    },
  });
}
