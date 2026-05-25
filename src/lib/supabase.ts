import { createClient } from "@supabase/supabase-js";

function normalizeEnvValue(value: string | undefined) {
  if (!value) return "";
  // Strip whitespace + zero-width / BOM chars that can sneak in via dashboard copy/paste
  // and would silently break HTTP headers (e.g. apikey).
  return value
    .replace(/^[\s\uFEFF\u200B\u200C\u200D]+|[\s\uFEFF\u200B\u200C\u200D]+$/g, "")
    .replace(/^['\"]|['\"]$/g, "");
}

type EnvLookup = { value: string; source: string };

function readEnv(...keys: string[]): EnvLookup {
  for (const key of keys) {
    const raw = import.meta.env[key];
    const value = normalizeEnvValue(raw);
    if (value) return { value, source: key };
  }
  return { value: "", source: "" };
}

const urlLookup = readEnv(
  "VITE_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL"
);
const anonKeyLookup = readEnv(
  "VITE_SUPABASE_ANON_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_KEY"
);

const supabaseUrl = urlLookup.value;
const supabaseAnonKey = anonKeyLookup.value;

const isPlaceholderValue = (value: string) =>
  /^(changeme|placeholder|your[_-]?|example)/i.test(value);

const isValidSupabaseUrl = (() => {
  if (!supabaseUrl || isPlaceholderValue(supabaseUrl)) {
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
  urlSource: urlLookup.source || "missing",
  anonKeySource: anonKeyLookup.source || "missing",
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  isValidSupabaseUrl,
  isValidAnonKey,
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
