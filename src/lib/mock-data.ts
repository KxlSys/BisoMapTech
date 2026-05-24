import type { Profile } from "@/types";

export const MOCK_PROFILES: Profile[] = [
  {
    id: "mock-1",
    username: "jb-moukoko",
    full_name: "Jean-Baptiste Moukoko",
    avatar_url:
      "https://api.dicebear.com/9.x/initials/svg?seed=JBM&backgroundColor=0d9488",
    bio: "Passionné de web, je construis des interfaces modernes et performantes.",

    city: "Brazzaville",
    département: "Brazzaville",

    latitude: -4.2634,
    longitude: 15.2429,

    github_url: "https://github.com/jb-moukoko",

    tech_stack: [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Node.js",
    ],

    role_type: "frontend",
    experience_level: "senior",

    open_to_collaboration: true,
    role: "contributor",

    created_at: "2026-01-10T08:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",

    last_seen_at: new Date(
      Date.now() - 1000 * 60 * 30
    ).toISOString(),
  },

  {
    id: "mock-2",
    username: "grace-ngoma",
    full_name: "Grace Ngoma",
    avatar_url:
      "https://api.dicebear.com/9.x/initials/svg?seed=GN&backgroundColor=7c3aed",
    bio: "Architecte backend spécialisée en APIs REST et systèmes distribués.",

    city: "Pointe-Noire",
    département: "Pointe-Noire",

    latitude: -4.7692,
    longitude: 11.866,

    github_url: "https://github.com/grace-ngoma",

    tech_stack: [
      "Python",
      "Django",
      "PostgreSQL",
      "Docker",
      "Redis",
    ],

    role_type: "backend",
    experience_level: "senior",

    open_to_collaboration: true,
    role: "contributor",

    created_at: "2026-01-15T08:00:00Z",
    updated_at: "2026-05-18T10:00:00Z",

    last_seen_at: new Date(
      Date.now() - 1000 * 60 * 60 * 3
    ).toISOString(),
  },

  {
    id: "mock-3",
    username: "patrick-loemba",
    full_name: "Patrick Loemba",
    avatar_url:
      "https://api.dicebear.com/9.x/initials/svg?seed=PL&backgroundColor=0891b2",
    bio: "Développeur fullstack, j'aime construire des produits de A à Z.",

    city: "Brazzaville",
    département: "Brazzaville",

    latitude: -4.2634,
    longitude: 15.2429,

    github_url: "https://github.com/patrick-loemba",

    tech_stack: [
      "Vue.js",
      "Laravel",
      "MySQL",
      "Docker",
    ],

    role_type: "fullstack",
    experience_level: "mid",

    open_to_collaboration: false,
    role: "contributor",

    created_at: "2026-02-01T08:00:00Z",
    updated_at: "2026-05-15T10:00:00Z",

    last_seen_at: new Date(
      Date.now() - 1000 * 60 * 60 * 24
    ).toISOString(),
  },

  {
    id: "mock-4",
    username: "aurelia-nkounkou",
    full_name: "Aurélia Nkounkou",
    avatar_url:
      "https://api.dicebear.com/9.x/initials/svg?seed=AN&backgroundColor=be185d",
    bio: "Data scientist, j'explore les données pour en extraire de la valeur.",

    city: "Brazzaville",
    département: "Brazzaville",

    latitude: -4.2634,
    longitude: 15.2429,

    github_url: "https://github.com/aurelia-nkounkou",

    tech_stack: [
      "Python",
      "TensorFlow",
      "Pandas",
      "SQL",
      "Power BI",
    ],

    role_type: "data",
    experience_level: "mid",

    open_to_collaboration: true,
    role: "contributor",

    created_at: "2026-02-10T08:00:00Z",
    updated_at: "2026-05-22T10:00:00Z",

    last_seen_at: new Date(
      Date.now() - 1000 * 60 * 5
    ).toISOString(),
  },

  {
    id: "mock-5",
    username: "chris-mabiala",
    full_name: "Chris Mabiala",
    avatar_url:
      "https://api.dicebear.com/9.x/initials/svg?seed=CM&backgroundColor=d97706",
    bio: "Dev mobile, je crée des apps Android et iOS avec Flutter.",

    city: "Dolisie",
    département: "Niari",

    latitude: -4.1994,
    longitude: 12.6731,

    github_url: "https://github.com/chris-mabiala",

    tech_stack: [
      "Flutter",
      "Dart",
      "Firebase",
      "Kotlin",
    ],

    role_type: "mobile",
    experience_level: "junior",

    open_to_collaboration: true,
    role: "contributor",

    created_at: "2026-03-01T08:00:00Z",
    updated_at: "2026-05-10T10:00:00Z",

    last_seen_at: new Date(
      Date.now() - 1000 * 60 * 60 * 48
    ).toISOString(),
  },
];