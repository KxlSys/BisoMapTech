import { createClient } from "@supabase/supabase-js";

function normalizeEnvValue(value: string | undefined) {
  if (!value) return "";
  // Strip whitespace + zero-width / BOM chars that can sneak in via dashboard copy/paste
  // and would silently break HTTP headers (e.g. apikey).
  return value
    .replace(/^[\s\uFEFF\u200B\u200C\u200D]+|[\s\uFEFF\u200B\u200C\u200D]+$/g, "")
    .replace(/^['\"]|['\"]$/g, "");
}

const supabaseUrl = normalizeEnvValue(
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL
);

const supabaseAnonKey = normalizeEnvValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const isPlaceholderValue = (value: string) =>
  /^(changeme|placeholder|your[_-]?|example)/i.test(value);

// Detect a very common misconfiguration: pasting the full REST endpoint
// (e.g. https://xxx.supabase.co/rest/v1) instead of the project root URL.
// supabase-js then appends /auth/v1/authorize on top → /rest/v1/auth/v1/authorize
// which is routed through the PostgREST gateway and rejected with
// {"message":"No API key found in request"} on OAuth flows.
const urlHasUnexpectedPath = (() => {
  if (!supabaseUrl) return false;
  try {
    const u = new URL(supabaseUrl);
    const path = u.pathname.replace(/\/+$/, "");
    return path.length > 0; // any non-root path is a problem
  } catch {
    return false;
  }
})();

const isValidSupabaseUrl = (() => {
  if (!supabaseUrl || isPlaceholderValue(supabaseUrl)) {
    return false;
  }
  if (urlHasUnexpectedPath) {
    return false;
  }

  try {
    const url = new URL(supabaseUrl);
    return /^https?:$/.test(url.protocol);
  } catch {
    return false;
  }
})();

const isValidAnonKey =
  Boolean(supabaseAnonKey) && !isPlaceholderValue(supabaseAnonKey);

export const isSupabaseConfigured = isValidSupabaseUrl && isValidAnonKey;

// Mask helpers — values intentionally exposed: URLs are public, key shows only first 6 chars
// + length so we can tell from the prod console whether the build actually inlined them.
const maskKey = (value: string) => {
  if (!value) return "(empty)";
  const head = value.slice(0, 6);
  return `${head}...(len=${value.length})`;
};

export const supabaseConfigStatus = {
  urlSource: supabaseUrl ? "configured" : "missing",
  anonKeySource: supabaseAnonKey ? "configured" : "missing",
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  isValidSupabaseUrl,
  isValidAnonKey,
  urlHasUnexpectedPath,
  // Diagnostics that surface what was ACTUALLY baked into the bundle by Vite at build time.
  urlPreview: supabaseUrl || "(empty)",
  anonKeyPreview: maskKey(supabaseAnonKey),
  anonKeyLength: supabaseAnonKey.length,
  buildMode: import.meta.env.MODE,
  isProd: import.meta.env.PROD,
};

// Always log once at startup so we can verify in production what the bundle contains.
// URLs are public; the key is masked to avoid leaking the full value.
console.info("[supabase-config]", supabaseConfigStatus);

if (urlHasUnexpectedPath) {
  console.error(
    "[supabase-config] VITE_SUPABASE_URL contains a path (e.g. /rest/v1). " +
      "Use only the project root, e.g. https://<ref>.supabase.co — supabase-js " +
      "appends /auth/v1, /rest/v1 and /storage/v1 itself.",
    { urlPreview: supabaseUrl }
  );
}

if (!isSupabaseConfigured) {
  console.error(
    "Configuration Supabase invalide: vérifiez VITE_SUPABASE_URL et une clé publique (VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY).",
    supabaseConfigStatus
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
