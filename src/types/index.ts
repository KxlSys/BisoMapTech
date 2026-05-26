export type Department =
  | "Bouenza"
  | "Brazzaville"
  | "Cuvette"
  | "Cuvette-Ouest"
  | "Kouilou"
  | "Lékoumou"
  | "Likouala"
  | "Niari"
  | "Plateaux"
  | "Pointe-Noire"
  | "Pool"
  | "Sangha"
  | "Nkéni-Alima"
  | "Djoué-Léfini"
  | "Congo-Oubangui";

export type RoleType =
  | "frontend"
  | "backend"
  | "fullstack"
  | "mobile"
  | "data"
  | "devops"
  | "sysadmin"
  | "cybersecurite"
  | "support"
  | "design"
  | "hardware"
  | "product"
  | "enseignement"
  | "nocode"
  | "vibecoder"
  | "autre";

export type ExperienceLevel =
  | "junior"
  | "mid"
  | "senior";

export type UserRole =
  | "visitor"
  | "contributor"
  | "admin";

export type PlaceStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface Profile {
  id: string;

  username: string;
  full_name: string;

  avatar_url: string;
  bio: string;

  city: string;
  département: Department;

  latitude: number;
  longitude: number;

  github_url: string;

  tech_stack: string[];

  role_type: RoleType;
  experience_level: ExperienceLevel;

  open_to_collaboration: boolean;

  role: UserRole;

  created_at: string;
  updated_at: string;
  last_seen_at?: string;
  e2ee_public_key?: string;
}

export interface Repository {
  id: string;

  profile_id: string;

  name: string;
  description: string;
  language: string;

  stars: number;

  url: string;

  is_pinned: boolean;

  created_at: string;
}

export interface AdminInvitation {
  id: string;

  invited_by: string;
  invited_email: string;

  status: "pending" | "accepted" | "expired";

  token: string;

  created_at: string;
  expires_at: string;
}

export interface CityCoordinates {
  name: string;
  département: Department;

  latitude: number;
  longitude: number;
}

export interface Message {
  id: string;

  sender_id: string;
  receiver_id: string;

  content: string;

  read_at: string | null;

  created_at: string;
  is_encrypted?: boolean;
  encryption_iv?: string | null;
  attachment_url?: string | null;
  attachment_type?: "image" | "pdf" | "voice" | null;
  attachment_name?: string | null;
  attachment_iv?: string | null;
  attachment_key?: string | null;
}

export type ConnectionStatus = "pending" | "accepted";

export interface Connection {
  id: string;

  requester_id: string;
  addressee_id: string;

  status: ConnectionStatus;

  created_at: string;
  updated_at: string;
}

/** Relationship between the current user and another member, from "my" point of view. */
export type ConnectionState =
  | "self"
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "connected";

export type ConnectionPartner = Pick<
  Profile,
  "id" | "username" | "full_name" | "avatar_url" | "e2ee_public_key"
>;

export interface ConnectionWithProfiles extends Connection {
  requester: ConnectionPartner | null;
  addressee: ConnectionPartner | null;
}

export interface Report {
  id: string;

  reporter_id: string;
  reported_id: string | null;

  message_id: string | null;

  reason: string;

  status: "pending" | "reviewed" | "dismissed";

  created_at: string;

  reporter: {
    full_name: string;
  } | null;

  reported?: {
    full_name: string;
    username: string;
  } | null;

  message?: {
    content: string;
  } | null;
}

export interface Place {
  id: string;

  name: string;
  category: string;
  description: string;

  city: string;
  address: string;

  latitude: number;
  longitude: number;

  phone: string;
  whatsapp: string;
  website: string;

  status: PlaceStatus;

  created_by: string | null;
  approved_by: string | null;

  approved_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: string;
  profile_id: string;
  role: 'owner' | 'collaborator';
  joined_at: string;
  profile?: Profile;
}

export interface ProjectMessage {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}
