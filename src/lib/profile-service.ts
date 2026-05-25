import { supabase } from "@/lib/supabase";
import type { Profile, Repository } from "@/types";

function sanitizeSearchTerm(value: string): string {
  return value
    .trim()
    .slice(0, 60)
    .replace(/[(),]/g, " ")
    .replace(/[%_]/g, " ")
    .replace(/\s+/g, " ");
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function fetchPaginatedProfiles(params: {
  page: number;
  pageSize: number;
  search?: string;
  city?: string;
  département?: string;
  roleType?: string;
  experienceLevel?: string;
  techStack?: string[];
  openToCollaboration?: boolean | null;
}): Promise<{ profiles: Profile[]; total: number }> {
  const { page, pageSize, search, city, département, roleType, experienceLevel, techStack, openToCollaboration } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("profiles").select("*", { count: "exact" });

  if (search) {
    const safeSearch = sanitizeSearchTerm(search);
    if (safeSearch) {
      query = query.or(
        `full_name.ilike.%${safeSearch}%,username.ilike.%${safeSearch}%,bio.ilike.%${safeSearch}%`
      );
    }
  }

  if (city && city !== "all") {
    query = query.eq("city", city);
  }
  if (département && département !== "all") {
    query = query.eq("département", département);
  }

  if (roleType && roleType !== "all") {
    query = query.eq("role_type", roleType);
  }

  if (experienceLevel && experienceLevel !== "all") {
    query = query.eq("experience_level", experienceLevel);
  }

  if (openToCollaboration !== null && openToCollaboration !== undefined) {
    query = query.eq("open_to_collaboration", openToCollaboration);
  }

  if (techStack && techStack.length > 0) {
    query = query.overlaps("tech_stack", techStack);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) throw error;
  return { profiles: (data ?? []) as Profile[], total: count ?? 0 };
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function fetchProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function fetchRepositories(profileId: string): Promise<Repository[]> {
  const { data, error } = await supabase
    .from("repositories")
    .select("*")
    .eq("profile_id", profileId)
    .order("stars", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Repository[];
}

/**
 * Update the current user's profile.
 *
 * Always uses an UPDATE; if the row does not exist (e.g., the OAuth-callback
 * insert silently failed earlier), it returns `false` so the caller can
 * decide to fall back to {@link upsertProfile}.
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, "id" | "created_at">>
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return false;
  }

  triggerGithubSync(updates.github_url, userId);
  return true;
}

/**
 * Idempotent profile write — guarantees a row exists for the given userId.
 *
 * This is the safe default for onboarding and edits where we cannot trust
 * that the OAuth-callback insert succeeded. The caller MUST provide the
 * `username` (the only NOT NULL column without a default) when creating a
 * brand-new row.
 */
export async function upsertProfile(
  userId: string,
  patch: Partial<Omit<Profile, "id" | "created_at">> & { username?: string }
): Promise<void> {
  const payload: Record<string, unknown> = {
    id: userId,
    ...patch,
    updated_at: new Date().toISOString(),
  };

  // Strip undefined values so we never send `undefined` to Supabase, which
  // would otherwise be coerced into NULL and could break NOT NULL columns.
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) throw error;

  triggerGithubSync(patch.github_url, userId);
}

function triggerGithubSync(githubUrl: string | undefined, userId: string) {
  if (!githubUrl) return;
  const githubUsername = githubUrl.replace(/\/+$/, "").split("/").pop();
  if (!githubUsername) return;

  // Fire-and-forget; failures should never block the profile save.
  supabase.functions
    .invoke("sync-github-repos", {
      body: { username: githubUsername, profile_id: userId },
    })
    .then(() => {})
    .catch((err) => {
      console.warn("sync-github-repos failed (non-blocking):", err);
    });
}

// ============================================================
// Avatar upload
// ============================================================

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const AVATAR_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export class AvatarUploadError extends Error {
  code:
    | "invalid_type"
    | "too_large"
    | "storage_unavailable"
    | "upload_failed"
    | "url_failed";
  constructor(code: AvatarUploadError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "AvatarUploadError";
  }
}

export interface UploadAvatarResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload an avatar image to Supabase Storage and return a public URL.
 *
 * Validates MIME type and size before hitting the network so the user gets
 * fast, actionable feedback instead of a generic storage error.
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<UploadAvatarResult> {
  if (!AVATAR_ALLOWED_MIME.has(file.type)) {
    throw new AvatarUploadError(
      "invalid_type",
      "Format non supporté. Utilisez JPG, PNG, WebP ou GIF."
    );
  }

  if (file.size > AVATAR_MAX_BYTES) {
    throw new AvatarUploadError(
      "too_large",
      "Image trop lourde (max 2 Mo). Compressez ou redimensionnez avant l'upload."
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  // Folder = user uid (matches storage RLS policy); filename includes a
  // timestamp so the public URL changes after every upload, defeating CDN
  // caches that would otherwise serve the previous avatar.
  const path = `${userId}/${Date.now()}.${extension.replace(/[^a-z0-9]/g, "")}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    const message = uploadError.message?.toLowerCase() || "";
    if (message.includes("bucket") && message.includes("not found")) {
      throw new AvatarUploadError(
        "storage_unavailable",
        "Le stockage des avatars n'est pas configuré. Contactez un administrateur."
      );
    }
    throw new AvatarUploadError(
      "upload_failed",
      `Échec de l'upload : ${uploadError.message}`
    );
  }

  const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);

  if (!publicData?.publicUrl) {
    throw new AvatarUploadError(
      "url_failed",
      "Image envoyée mais l'URL publique n'a pas pu être générée."
    );
  }

  return { publicUrl: publicData.publicUrl, path };
}

export function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
