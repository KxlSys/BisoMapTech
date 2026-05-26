import { supabase } from "@/lib/supabase";
import type { ProjectMessage } from "@/types";

export interface ProjectGroup {
  project_id: string;
  role: "owner" | "collaborator";
  project: {
    id: string;
    title: string;
    description: string;
    priority?: string;
    location?: string;
  } | null;
}

/**
 * Récupère la liste des groupes de projet (les projets auxquels participe l'utilisateur).
 */
export async function fetchUserProjectGroups(profileId: string): Promise<ProjectGroup[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select(`
      project_id,
      role,
      project:projects(id, title, description, priority, location)
    `)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Erreur lors de la récupération des groupes de projet:", error);
    return [];
  }

  // Cast de sécurité pour s'assurer que les données retournées sont conformes
  return (data || []) as unknown as ProjectGroup[];
}

/**
 * Récupère tous les messages d'un groupe de projet, triés par date de création.
 */
export async function fetchProjectMessages(projectId: string): Promise<ProjectMessage[]> {
  const { data, error } = await supabase
    .from("project_messages")
    .select(`
      id,
      project_id,
      sender_id,
      content,
      created_at,
      sender:profiles!project_messages_sender_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as ProjectMessage[];
}

/**
 * Envoie un nouveau message dans le groupe de projet.
 */
export async function sendProjectMessage(
  projectId: string,
  senderId: string,
  content: string
): Promise<ProjectMessage> {
  const { data, error } = await supabase
    .from("project_messages")
    .insert({
      project_id: projectId,
      sender_id: senderId,
      content: content,
    })
    .select(`
      id,
      project_id,
      sender_id,
      content,
      created_at,
      sender:profiles!project_messages_sender_id_fkey(id, username, full_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data as unknown as ProjectMessage;
}

/**
 * Récupère la liste des membres associés à un projet.
 */
export async function fetchProjectMembers(projectId: string) {
  const { data, error } = await supabase
    .from("project_members")
    .select(`
      project_id,
      profile_id,
      role,
      joined_at,
      profile:profiles(id, username, full_name, avatar_url)
    `)
    .eq("project_id", projectId);

  if (error) throw error;
  return data || [];
}
