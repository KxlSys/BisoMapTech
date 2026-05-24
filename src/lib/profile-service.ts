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
  roleType?: string;
  experienceLevel?: string;
  techStack?: string[];
  openToCollaboration?: boolean | null;
}): Promise<{ profiles: Profile[]; total: number }> {
  const { page, pageSize, search, city, roleType, experienceLevel, techStack, openToCollaboration } = params;
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

export async function fetchRepositories(profileId: string): Promise<Repository[]> {
  const { data, error } = await supabase
    .from("repositories")
    .select("*")
    .eq("profile_id", profileId)
    .order("stars", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Repository[];
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, "id" | "created_at">>
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;

  if (updates.github_url) {
    const githubUsername = updates.github_url.replace(/\/+$/, "").split("/").pop();
    if (githubUsername) {
      supabase.functions
        .invoke("sync-github-repos", {
          body: { username: githubUsername, profile_id: userId },
        })
        .then(() => {});
    }
  }
}

export function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
