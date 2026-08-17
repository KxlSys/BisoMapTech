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
  // ⚡ Bolt: Pre-calculate the current user's tech stack as a Set to avoid O(N*M) lookups
  const currentUserTechsSet = new Set(currentUser.tech_stack);
  const results: MatchResult[] = [];

  // ⚡ Bolt: Hoist the lowercase transformation of the current user's city
  // to avoid redundant string allocations and computations in the loop
  const currentUserCityLower = currentUser.city?.toLowerCase();

  // ⚡ Bolt: Consolidate .filter().map().filter() into a single O(n) loop to reduce allocations
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate.id === currentUser.id || !candidate.open_to_collaboration) {
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    const complementary = COMPLEMENTARY_ROLES[currentUser.role_type] || [];
    if (complementary.includes(candidate.role_type)) {
      score += 30;
      reasons.push("Competences complementaires");
    }

    // ⚡ Bolt: Count intersection with a manual loop instead of .filter().length
    // This prevents creating a new intermediate array per candidate,
    // reducing garbage collection overhead.
    let commonTechsCount = 0;
    for (let j = 0; j < candidate.tech_stack.length; j++) {
      if (currentUserTechsSet.has(candidate.tech_stack[j])) {
        commonTechsCount++;
      }
    }

    if (commonTechsCount > 0) {
      score += Math.min(commonTechsCount * 10, 25);
      reasons.push(`${commonTechsCount} technologie(s) en commun`);
    }

    if (
      currentUserCityLower &&
      candidate.city &&
      currentUserCityLower === candidate.city.toLowerCase()
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

    if (score > 0) {
      results.push({ profile: candidate, score: Math.min(score, 100), reasons });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function calculateProjectMatches(
  profile: Profile,
  projects: Project[]
): ProjectMatch[] {
  // ⚡ Bolt: Pre-calculate the lowercased profile tech stack as a Set for O(1) lookups.
  // This avoids instantiating new arrays/sets per project inside the main loop.
  const profileTechsLowerSet = new Set(profile.tech_stack.map((t) => t.toLowerCase()));
  const results: ProjectMatch[] = [];

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    let score = 0;
    const reasons: string[] = [];

    // ⚡ Bolt: Replace multiple chained methods (.map, .filter, .some) and inner Set creations
    // with a single unified loop over the project's tech stack to dramatically reduce allocations.
    let commonTechsCount = 0;
    let roleInStack = false;
    const r = profile.role_type;

    for (let j = 0; j < project.tech_stack.length; j++) {
      const tl = project.tech_stack[j].toLowerCase();

      if (profileTechsLowerSet.has(tl)) {
        commonTechsCount++;
      }

      if (!roleInStack) {
        roleInStack = (
          (r === "frontend" && (tl.includes("react") || tl.includes("vue") || tl.includes("angular") || tl.includes("next") || tl.includes("svelte"))) ||
          (r === "mobile" && (tl.includes("flutter") || tl.includes("react native") || tl.includes("dart") || tl.includes("mobile"))) ||
          (r === "backend" && (tl.includes("node") || tl.includes("python") || tl.includes("django") || tl.includes("php") || tl.includes("java") || tl.includes("go") || tl.includes("rust"))) ||
          (r === "fullstack" && (tl.includes("react") || tl.includes("node") || tl.includes("next") || tl.includes("supabase") || tl.includes("typescript"))) ||
          (r === "data" && (tl.includes("python") || tl.includes("sql") || tl.includes("spark") || tl.includes("data"))) ||
          (r === "devops" && (tl.includes("docker") || tl.includes("kubernetes") || tl.includes("aws") || tl.includes("linux"))) ||
          (r === "cybersecurite" && (tl.includes("cyber") || tl.includes("linux") || tl.includes("securite") || tl.includes("reseaux"))) ||
          (r === "design" && (tl.includes("figma") || tl.includes("design") || tl.includes("ui")))
        );
      }
    }

    if (commonTechsCount > 0) {
      score += Math.min(commonTechsCount * 15, 40);
      reasons.push(`${commonTechsCount} techno(s) en commun`);
    }

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

    if (score > 0) {
      results.push({ project, score: Math.min(score, 100), reasons });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
