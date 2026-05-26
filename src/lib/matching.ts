import type { Profile, Project, ProjectMatch } from "@/types";

const COMPLEMENTARY_ROLES: Record<string, string[]> = {
  frontend: ["backend", "fullstack", "devops", "design"],
  backend: ["frontend", "fullstack", "mobile", "devops", "data"],
  fullstack: ["frontend", "backend", "data", "devops", "mobile", "design"],
  mobile: ["backend", "fullstack", "devops", "design"],
  data: ["backend", "fullstack", "devops"],
  devops: ["backend", "fullstack", "data", "sysadmin", "cybersecurite"],
  sysadmin: ["devops", "cybersecurite", "support", "hardware"],
  cybersecurite: ["sysadmin", "devops", "backend", "support"],
  support: ["sysadmin", "hardware", "cybersecurite"],
  design: ["frontend", "fullstack", "mobile", "product"],
  hardware: ["sysadmin", "support"],
  product: ["frontend", "backend", "fullstack", "design", "enseignement"],
  enseignement: ["product", "frontend", "backend", "data"],
  nocode: ["design", "product", "frontend"],
  autre: [
    "frontend",
    "backend",
    "fullstack",
    "mobile",
    "data",
    "devops",
    "sysadmin",
    "cybersecurite",
    "support",
    "design",
    "hardware",
    "product",
    "enseignement",
    "nocode",
  ],
};


export interface MatchResult {
  profile: Profile;
  score: number;
  reasons: string[];
}

export function calculateMatches(
  currentUser: Profile,
  candidates: Profile[]
): MatchResult[] {
  return candidates
    .filter((c) => c.id !== currentUser.id && c.open_to_collaboration)
    .map((candidate) => {
      let score = 0;
      const reasons: string[] = [];

      const complementary = COMPLEMENTARY_ROLES[currentUser.role_type] || [];
      if (complementary.includes(candidate.role_type)) {
        score += 30;
        reasons.push("Competences complementaires");
      }

      const commonTechs = currentUser.tech_stack.filter((t) =>
        candidate.tech_stack.includes(t)
      );
      if (commonTechs.length > 0) {
        score += Math.min(commonTechs.length * 10, 25);
        reasons.push(`${commonTechs.length} technologie(s) en commun`);
      }

      if (
        currentUser.city &&
        candidate.city &&
        currentUser.city.toLowerCase() === candidate.city.toLowerCase()
      ) {
        score += 20;
        reasons.push("Meme ville");
      }

      const levelMap = { junior: 1, mid: 2, senior: 3 };
      const diff = Math.abs(
        levelMap[currentUser.experience_level] -
          levelMap[candidate.experience_level]
      );
      if (diff <= 1) {
        score += 15;
        reasons.push("Niveau d'experience compatible");
      }

      if (candidate.open_to_collaboration) {
        score += 10;
      }

      return { profile: candidate, score: Math.min(score, 100), reasons };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function calculateProjectMatches(
  profile: Profile,
  projects: Project[]
): ProjectMatch[] {
  return projects
    .map((project) => {
      let score = 0;
      const reasons: string[] = [];

      const commonTechs = profile.tech_stack.filter((t) =>
        project.tech_stack.map((pt) => pt.toLowerCase()).includes(t.toLowerCase())
      );
      if (commonTechs.length > 0) {
        score += Math.min(commonTechs.length * 15, 40);
        reasons.push(`${commonTechs.length} techno(s) en commun`);
      }

      const roleInStack = project.tech_stack.some((t) => {
        const tl = t.toLowerCase();
        const r = profile.role_type;
        return (
          (r === "frontend" && (tl.includes("react") || tl.includes("vue") || tl.includes("angular") || tl.includes("next") || tl.includes("svelte"))) ||
          (r === "mobile" && (tl.includes("flutter") || tl.includes("react native") || tl.includes("dart") || tl.includes("mobile"))) ||
          (r === "backend" && (tl.includes("node") || tl.includes("python") || tl.includes("django") || tl.includes("php") || tl.includes("java") || tl.includes("go") || tl.includes("rust"))) ||
          (r === "fullstack" && (tl.includes("react") || tl.includes("node") || tl.includes("next") || tl.includes("supabase") || tl.includes("typescript"))) ||
          (r === "data" && (tl.includes("python") || tl.includes("sql") || tl.includes("spark") || tl.includes("data"))) ||
          (r === "devops" && (tl.includes("docker") || tl.includes("kubernetes") || tl.includes("aws") || tl.includes("linux"))) ||
          (r === "cybersecurite" && (tl.includes("cyber") || tl.includes("linux") || tl.includes("securite") || tl.includes("reseaux"))) ||
          (r === "design" && (tl.includes("figma") || tl.includes("design") || tl.includes("ui")))
        );
      });
      if (roleInStack) {
        score += 25;
        reasons.push("Votre rôle correspond au projet");
      }

      if (project.open_to_collaboration && profile.open_to_collaboration) {
        score += 20;
        reasons.push("Les deux parties disponibles");
      }

      if (profile.experience_level === "senior") {
        score += 10;
        reasons.push("Profil senior valorisé");
      } else if (profile.experience_level === "mid") {
        score += 5;
      }

      return { project, score: Math.min(score, 100), reasons };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}
