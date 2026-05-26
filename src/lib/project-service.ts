import { supabase } from "@/lib/supabase";
import { MOCK_PROJECTS } from "@/lib/mock-projects";
import type { Project } from "@/types";

export async function fetchProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*, author:profiles!projects_author_id_fkey(id, username, full_name, avatar_url)")
      .eq("open_to_collaboration", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) return data as Project[];
  } catch {
    // Table may not exist yet — fall through to mock data
  }
  return MOCK_PROJECTS;
}

export async function createProject(
  authorId: string,
  fields: Omit<Project, "id" | "author_id" | "author" | "created_at" | "updated_at">
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...fields, author_id: authorId })
    .select("*, author:profiles!projects_author_id_fkey(id, username, full_name, avatar_url)")
    .single();

  if (error) throw error;
  return data as Project;
}
