export type RoleType =
  | "frontend"
  | "backend"
  | "fullstack"
  | "data"
  | "devops"
  | "mobile"
  | "autre";

export type ExperienceLevel = "junior" | "mid" | "senior";

export type UserRole = "visitor" | "contributor" | "admin";

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  city: string;
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
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string | null;
  message_id: string | null;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
  reporter: { full_name: string } | null;
}

export type PlaceStatus = "pending" | "approved" | "rejected";

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
