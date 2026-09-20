// ======================================================
// MÉTADONNÉES DE PAGE ET DE PARTAGE
// ------------------------------------------------------
// Ce module est volontairement sans aucune importation : il est utilisé
// à la fois par l'application React et par la fonction edge qui répond aux
// robots de WhatsApp, Facebook et consorts, où l'alias « @/ » n'existe pas.
// ======================================================

export const SITE_NAME = "BisoMapTech";
export const SITE_URL = "https://bisomaptech.vercel.app";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface PageMeta {
  title: string;
  description: string;
  image: string;
  url: string;
  type: "website" | "profile";
  card: "summary" | "summary_large_image";
}

export const DEFAULT_META: PageMeta = {
  title: "BisoMapTech — La carte des talents tech congolais",
  description:
    "L'annuaire de référence des talents tech en République du Congo. Collaborez, construisez et grandissez ensemble.",
  image: DEFAULT_OG_IMAGE,
  url: SITE_URL,
  type: "website",
  card: "summary_large_image",
};

/**
 * Libellés de métier pour les aperçus de partage.
 *
 * Duplique volontairement `ROLE_TYPE_LABELS` de `constants.ts` : ce module doit
 * rester importable depuis la fonction edge, qui ne résout pas l'alias « @/ ».
 * Un test vérifie que les deux tables restent identiques.
 */
export const ROLE_SHARE_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Fullstack",
  data: "Data / IA",
  devops: "DevOps / Cloud",
  mobile: "Mobile",
  sysadmin: "Systèmes & Réseaux",
  cybersecurite: "Cybersécurité",
  support: "Support / Helpdesk",
  design: "Design / UX",
  hardware: "Hardware / Électronique",
  product: "Gestion de projet / Product",
  enseignement: "Enseignement / Formation",
  nocode: "No-code / Automatisation",
  vibecoder: "Vibe-coder",
  autre: "Autre",
};

/** Coupe sur un mot entier et ajoute une ellipse, pour éviter les phrases tronquées au milieu. */
export function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export interface ProfileMetaInput {
  username: string;
  full_name?: string | null;
  role_type?: string | null;
  city?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  tech_stack?: string[] | null;
}

/**
 * Aperçu d'un profil. Le titre porte le nom, le métier et la ville, parce que
 * c'est ce qu'un destinataire lit dans une conversation WhatsApp avant de
 * décider s'il ouvre le lien.
 */
export function buildProfileMeta(profile: ProfileMetaInput): PageMeta {
  const name = (profile.full_name || "").trim() || profile.username;
  const role = profile.role_type ? ROLE_SHARE_LABELS[profile.role_type] : "";
  const city = (profile.city || "").trim();

  const qualifiers = [role, city].filter(Boolean).join(" · ");
  const title = qualifiers
    ? `${name} — ${qualifiers} | ${SITE_NAME}`
    : `${name} | ${SITE_NAME}`;

  const bio = (profile.bio || "").trim();
  const stack = (profile.tech_stack || []).filter(Boolean).slice(0, 5);

  let description: string;
  if (bio) {
    description = truncate(bio, 200);
  } else if (stack.length > 0) {
    description = truncate(`${stack.join(", ")}. Profil sur la carte de la communauté tech congolaise.`, 200);
  } else {
    description = `Profil de ${name} sur la carte de la communauté tech congolaise.`;
  }

  const avatar = (profile.avatar_url || "").trim();

  return {
    title,
    description,
    // L'avatar est carré : une grande carte de partage le rognerait mal.
    image: avatar || DEFAULT_OG_IMAGE,
    url: `${SITE_URL}/contributeurs/${encodeURIComponent(profile.username)}`,
    type: "profile",
    card: avatar ? "summary" : "summary_large_image",
  };
}

/** Échappe le texte destiné à un attribut HTML construit à la main. */
export function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Page HTML minimale servie aux robots d'aperçu. Ils ne lisent que le `<head>`
 * et n'exécutent pas JavaScript ; un humain qui atterrirait ici est renvoyé
 * vers l'application.
 */
export function renderMetaDocument(meta: PageMeta): string {
  const e = escapeHtmlAttribute;
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>${e(meta.title)}</title>
    <meta name="description" content="${e(meta.description)}" />
    <link rel="canonical" href="${e(meta.url)}" />
    <meta property="og:type" content="${e(meta.type)}" />
    <meta property="og:site_name" content="${e(SITE_NAME)}" />
    <meta property="og:locale" content="fr_CG" />
    <meta property="og:url" content="${e(meta.url)}" />
    <meta property="og:title" content="${e(meta.title)}" />
    <meta property="og:description" content="${e(meta.description)}" />
    <meta property="og:image" content="${e(meta.image)}" />
    <meta name="twitter:card" content="${e(meta.card)}" />
    <meta name="twitter:title" content="${e(meta.title)}" />
    <meta name="twitter:description" content="${e(meta.description)}" />
    <meta name="twitter:image" content="${e(meta.image)}" />
    <meta name="theme-color" content="#0a1628" />
    <meta http-equiv="refresh" content="0; url=${e(meta.url)}" />
  </head>
  <body>
    <p><a href="${e(meta.url)}">${e(meta.title)}</a></p>
  </body>
</html>
`;
}
