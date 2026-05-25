// src/lib/constants.ts

import type { Department } from "@/types";
import { CONGO_CITIES } from "@/lib/cities";

// ======================================================
// TECH STACK OPTIONS
// ======================================================

export const TECH_OPTIONS = [
  // --- Développement web & mobile ---
  "React",
  "Vue.js",
  "Angular",
  "Next.js",
  "Node.js",
  "Express",
  "Python",
  "Django",
  "Flask",
  "FastAPI",
  "TypeScript",
  "JavaScript",
  "Go",
  "Rust",
  "Java",
  "Kotlin",
  "Swift",
  "Flutter",
  "React Native",
  "PHP",
  "Laravel",
  "Ruby",
  "Rails",
  "C#",
  ".NET",

  // --- Bases de données ---
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Firebase",
  "Supabase",
  "Redis",

  // --- DevOps / Cloud ---
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "Terraform",
  "Ansible",
  "CI/CD",
  "GraphQL",
  "REST API",
  "Git",
  "Tailwind CSS",

  // --- Systèmes & Réseaux ---
  "Linux",
  "Windows Server",
  "Active Directory",
  "Bash",
  "PowerShell",
  "Cisco",
  "MikroTik",
  "pfSense",
  "VMware",
  "Proxmox",
  "Zabbix",
  "Nagios",

  // --- Cybersécurité ---
  "Wireshark",
  "Nmap",
  "Metasploit",
  "Burp Suite",
  "Wazuh",
  "Kali Linux",
  "SIEM",
  "Pentest",

  // --- Support / Helpdesk ---
  "GLPI",
  "Ticketing",
  "ITIL",

  // --- Data / IA ---
  "Machine Learning",
  "Data Science",
  "TensorFlow",
  "Pandas",
  "Power BI",

  // --- Design ---
  "Figma",
  "Adobe XD",

  // --- No-code / Automatisation ---
  "n8n",
  "Zapier",
  "Make",
  "WordPress",
] as const;

// ======================================================
// ROLE LABELS
// ======================================================

export const ROLE_TYPE_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Fullstack",
  mobile: "Mobile",

  data: "Data / IA",

  devops: "DevOps / Cloud",

  sysadmin: "Systèmes & Réseaux",

  cybersecurite: "Cybersécurité",

  support: "Support / Helpdesk",

  design: "Design / UX",

  hardware: "Hardware / Électronique",

  product: "Gestion de projet / Product",

  enseignement: "Enseignement / Formation",

  nocode: "No-code / Automatisation",

  autre: "Autre",
};

export const DB_ROLE_TYPES = [
  "frontend",
  "backend",
  "fullstack",
  "data",
  "devops",
  "mobile",
  "autre",
] as const;

// ======================================================
// EXPERIENCE LABELS
// ======================================================

export const EXPERIENCE_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Intermédiaire",
  senior: "Senior",
};

// ======================================================
// PLACE CATEGORIES
// ======================================================

export const PLACE_CATEGORIES = [
  "Restaurant",
  "Marché",
  "Café",
  "Pharmacie",
  "Hôpital",
  "École / Université",
  "Espace Tech",
  "Incubateur",
  "Autre",
] as const;

// ======================================================
// départementS
// ======================================================

export const département_OPTIONS: Department[] = [
  "Bouenza",
  "Brazzaville",
  "Cuvette",
  "Cuvette-Ouest",
  "Kouilou",
  "Lékoumou",
  "Likouala",
  "Niari",
  "Plateaux",
  "Pointe-Noire",
  "Pool",
  "Sangha",

  // Zones complémentaires
  "Nkéni-Alima",
  "Djoué-Léfini",
  "Congo-Oubangui",
];

// ======================================================
// CITY OPTIONS
// ======================================================

export const CITY_OPTIONS = CONGO_CITIES.map(
  (city) => city.name
);
