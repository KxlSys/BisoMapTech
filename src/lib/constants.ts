// src/lib/constants.ts

import type { Department } from "@/types";
import { CONGO_CITIES } from "@/lib/cities";

// ======================================================
// TECH CATEGORIES
// ======================================================

export interface TechCategory {
  id: string;
  label: string;
  description: string;
  techs: readonly string[];
}

export const TECH_CATEGORIES: readonly TechCategory[] = [
  {
    id: "frontend",
    label: "Frontend & Web",
    description: "Interfaces web et frameworks JS",
    techs: [
      "React",
      "Vue.js",
      "Angular",
      "Next.js",
      "Svelte",
      "Astro",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "HTML/CSS",
    ],
  },
  {
    id: "backend",
    label: "Backend & APIs",
    description: "Services, APIs, langages serveur",
    techs: [
      "Node.js",
      "Express",
      "NestJS",
      "Python",
      "Django",
      "Flask",
      "FastAPI",
      "PHP",
      "Laravel",
      "Symfony",
      "Ruby",
      "Rails",
      "Java",
      "Spring Boot",
      "C#",
      ".NET",
      "Go",
      "Rust",
      "Elixir",
      "GraphQL",
      "REST API",
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    description: "Applications iOS, Android, cross-platform",
    techs: [
      "Flutter",
      "React Native",
      "Swift",
      "Kotlin",
      "Java (Android)",
      "Ionic",
      "Capacitor",
      "Xamarin",
      "Jetpack Compose",
      "SwiftUI",
    ],
  },
  {
    id: "embedded",
    label: "Embarqué & Électronique",
    description: "IoT, microcontrôleurs, hardware",
    techs: [
      "C",
      "C++",
      "Arduino",
      "Raspberry Pi",
      "ESP32",
      "STM32",
      "MicroPython",
      "FreeRTOS",
      "PCB Design",
      "VHDL",
      "Verilog",
    ],
  },
  {
    id: "data",
    label: "Data & IA",
    description: "Data science, machine learning, big data",
    techs: [
      "Machine Learning",
      "Deep Learning",
      "Data Science",
      "Data Engineering",
      "TensorFlow",
      "PyTorch",
      "scikit-learn",
      "Pandas",
      "NumPy",
      "Apache Spark",
      "Airflow",
      "dbt",
      "Power BI",
      "Tableau",
      "Jupyter",
      "Hugging Face",
      "LangChain",
      "OpenAI API",
    ],
  },
  {
    id: "databases",
    label: "Bases de données",
    description: "SQL, NoSQL, caches, search",
    techs: [
      "PostgreSQL",
      "MySQL",
      "MariaDB",
      "SQLite",
      "MongoDB",
      "Redis",
      "Elasticsearch",
      "Cassandra",
      "DynamoDB",
      "Firebase",
      "Supabase",
      "Neo4j",
      "ClickHouse",
    ],
  },
  {
    id: "cloud",
    label: "Cloud",
    description: "AWS, Azure, GCP & alternatives",
    techs: [
      "AWS",
      "Azure",
      "GCP",
      "Cloudflare",
      "DigitalOcean",
      "OVH",
      "Scaleway",
      "Vercel",
      "Netlify",
      "Heroku",
      "Render",
      "Lambda",
      "S3",
      "EC2",
    ],
  },
  {
    id: "devops",
    label: "DevOps & Infra",
    description: "CI/CD, conteneurs, IaC, observabilité",
    techs: [
      "Docker",
      "Kubernetes",
      "Helm",
      "Terraform",
      "Ansible",
      "Pulumi",
      "GitHub Actions",
      "GitLab CI",
      "Jenkins",
      "ArgoCD",
      "CI/CD",
      "Prometheus",
      "Grafana",
      "Datadog",
      "ELK Stack",
      "Nginx",
      "HAProxy",
    ],
  },
  {
    id: "sysadmin",
    label: "Systèmes & Réseaux",
    description: "SysAdmin, virtualisation, infra réseau",
    techs: [
      "Linux",
      "Ubuntu Server",
      "Debian",
      "CentOS / Rocky Linux",
      "Windows Server",
      "Active Directory",
      "Bash",
      "PowerShell",
      "VMware",
      "Proxmox",
      "Hyper-V",
      "Cisco",
      "MikroTik",
      "Juniper",
      "Fortinet",
      "pfSense",
      "OPNsense",
      "Zabbix",
      "Nagios",
      "BGP / OSPF",
      "VPN / IPsec",
    ],
  },
  {
    id: "cybersecurity",
    label: "Cybersécurité",
    description: "Pentest, SOC, SIEM, blue & red team",
    techs: [
      "Pentest",
      "SOC",
      "SIEM",
      "Wazuh",
      "Splunk",
      "Elastic Security",
      "Wireshark",
      "Nmap",
      "Metasploit",
      "Burp Suite",
      "OWASP ZAP",
      "Kali Linux",
      "Parrot OS",
      "Python (sécurité)",
      "Reverse Engineering",
      "Forensics",
      "ISO 27001",
      "NIST",
    ],
  },
  {
    id: "support",
    label: "Support IT & Helpdesk",
    description: "Helpdesk, ITSM, support utilisateurs",
    techs: [
      "GLPI",
      "ITIL",
      "ServiceNow",
      "Ticketing",
      "Jira Service Desk",
      "Office 365",
      "Google Workspace",
      "Hardware Support",
      "Réseau LAN/WAN",
    ],
  },
  {
    id: "gamedev",
    label: "Game Dev",
    description: "Jeux vidéo, moteurs, 3D temps réel",
    techs: [
      "Unity",
      "Unreal Engine",
      "Godot",
      "Phaser",
      "C# (Unity)",
      "C++ (Unreal)",
      "Blender",
      "Shader",
    ],
  },
  {
    id: "blockchain",
    label: "Blockchain & Web3",
    description: "Smart contracts, dApps, crypto",
    techs: [
      "Solidity",
      "Ethereum",
      "Hardhat",
      "Foundry",
      "Web3.js",
      "Ethers.js",
      "Rust (Solana)",
      "Polygon",
      "IPFS",
    ],
  },
  {
    id: "design",
    label: "Design & UX",
    description: "Outils de conception et prototypage",
    techs: [
      "Figma",
      "Adobe XD",
      "Sketch",
      "Photoshop",
      "Illustrator",
      "Canva",
      "Penpot",
    ],
  },
  {
    id: "nocode",
    label: "No-code & Automatisation",
    description: "Outils visuels et automatisation",
    techs: [
      "n8n",
      "Zapier",
      "Make",
      "Airtable",
      "Notion",
      "WordPress",
      "Webflow",
      "Bubble",
    ],
  },
  {
    id: "tools",
    label: "Outils & Workflow",
    description: "Utilitaires partagés à toutes les disciplines",
    techs: ["Git", "GitHub", "GitLab", "Bitbucket"],
  },
  {
    id: "vibecoding",
    label: "Vibe Coding & IA",
    description: "Développement assisté par IA, prompting, outils génératifs",
    techs: [
      "GitHub Copilot",
      "Cursor",
      "Windsurf",
      "Bolt.new",
      "v0",
      "Claude Code",
      "Lovable",
      "Replit AI",
      "Codeium",
      "Tabnine",
      "Prompt Engineering",
      "LLM Integration",
    ],
  },
] as const;

export const TECH_OPTIONS: readonly string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const cat of TECH_CATEGORIES) {
    for (const tech of cat.techs) {
      if (!seen.has(tech)) {
        seen.add(tech);
        out.push(tech);
      }
    }
  }
  return out;
})();

// One representative technology per discipline, so quick-pick suggestion
// chips stay balanced across every IT domain instead of defaulting to
// web/app dev. The cross-cutting "tools" category is excluded — it is not a
// discipline on its own.
export const CROSS_DOMAIN_TECHS: readonly string[] = TECH_CATEGORIES.filter(
  (cat) => cat.id !== "tools"
).map((cat) => cat.techs[0]);

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
  vibecoder: "Vibe-coder",
  autre: "Autre",
};

export const DB_ROLE_TYPES = [
  "fullstack",
  "frontend",
  "backend",
  "mobile",
  "data",
  "devops",
  "sysadmin",
  "cybersecurite",
  "hardware",
  "support",
  "design",
  "product",
  "nocode",
  "enseignement",
  "vibecoder",
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
  "Espace Tech",
  "Coworking",
  "Incubateur / Accélérateur",
  "Formation / Bootcamp",
  "Fab Lab",
  "Café",
  "Restaurant",
  "Marché",
  "Pharmacie",
  "Hôpital",
  "École / Université",
  "Opérateur Télécoms",
  "Cybercafé / Point Internet",
  "ONG Tech",
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
