import { createClient } from "@supabase/supabase-js";

function normalizeEnvValue(value: string | undefined) {
  if (!value) return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = normalizeEnvValue(import.meta.env[key]);
    if (value) return value;
  }
  return "";
}

const supabaseUrl = readEnv(
  "VITE_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL"
);
const supabaseAnonKey = readEnv(
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

export const supabaseConfigStatus = {
  urlSource: supabaseUrl ? "configured" : "missing",
  anonKeySource: supabaseAnonKey ? "configured" : "missing",
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  isValidSupabaseUrl,
  isValidAnonKey,
};

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
