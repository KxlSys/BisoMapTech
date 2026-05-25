import { createClient } from "@supabase/supabase-js";

function normalizeEnvValue(value: string | undefined) {
  if (!value) return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
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
    "Configuration Supabase invalide: vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.",
    supabaseConfigStatus
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
