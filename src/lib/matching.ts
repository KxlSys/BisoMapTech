import type { Profile } from "@/types";

const COMPLEMENTARY_ROLES: Record<string, string[]> = {
  frontend: ["backend", "fullstack", "devops"],
  backend: ["frontend", "fullstack", "mobile"],
  fullstack: ["frontend", "backend", "data", "devops", "mobile"],
  data: ["backend", "fullstack", "devops"],
  devops: ["backend", "fullstack", "data"],
  mobile: ["backend", "fullstack", "devops"],
  autre: ["frontend", "backend", "fullstack", "data", "devops", "mobile"],
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
