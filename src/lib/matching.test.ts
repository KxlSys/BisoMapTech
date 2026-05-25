import { describe, test, expect } from "vitest";
import { calculateMatches } from "./matching";
import type { Profile } from "@/types";

// Factory pour générer de faux profils de test facilement
function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-id-" + Math.random().toString(36).substr(2, 9),
    username: "testuser",
    full_name: "Test User",
    avatar_url: "",
    bio: "",
    city: "Brazzaville",
    département: "Brazzaville",
    latitude: 0,
    longitude: 0,
    github_url: "",
    tech_stack: [],
    role_type: "fullstack",
    experience_level: "mid",
    open_to_collaboration: true,
    role: "contributor",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Algorithme de Matching (calculateMatches)", () => {
  test("Devrait exclure l'utilisateur actuel des candidats", () => {
    const currentUser = createMockProfile({ id: "current-user-id" });
    const candidate = createMockProfile({ id: "current-user-id" });

    const results = calculateMatches(currentUser, [candidate]);
    expect(results).toHaveLength(0);
  });

  test("Devrait exclure les candidats fermés à la collaboration", () => {
    const currentUser = createMockProfile({ id: "user-a" });
    const candidate = createMockProfile({ 
      id: "user-b", 
      open_to_collaboration: false 
    });

    const results = calculateMatches(currentUser, [candidate]);
    expect(results).toHaveLength(0);
  });

  test("Devrait calculer un score parfait (100) pour deux profils idéalement compatibles", () => {
    const currentUser = createMockProfile({
      id: "user-a",
      role_type: "frontend",
      tech_stack: ["React", "TypeScript", "Tailwind CSS"],
      city: "Brazzaville",
      experience_level: "mid",
    });

    const candidate = createMockProfile({
      id: "user-b",
      role_type: "backend", // +30 points
      tech_stack: ["Node.js", "TypeScript", "PostgreSQL", "React"], // 2 techs communes (React, TypeScript) -> +20 points
      city: "Brazzaville", // +20 points
      experience_level: "senior", // diff 1 (mid/senior) -> +15 points
      open_to_collaboration: true, // +10 points
    });

    // Score total théorique = 30 + 20 + 20 + 15 + 10 = 95
    // Ajoutons une 3ème techno pour atteindre 30 points (max 25 pour techs)
    // Score théorique final avec 3 techs = 30 + 25 + 20 + 15 + 10 = 100
    candidate.tech_stack = ["Node.js", "TypeScript", "PostgreSQL", "React", "Tailwind CSS"];

    const results = calculateMatches(currentUser, [candidate]);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(100);
    expect(results[0].reasons).toContain("Competences complementaires");
    expect(results[0].reasons).toContain("Meme ville");
    expect(results[0].reasons).toContain("Niveau d'experience compatible");
    expect(results[0].reasons).toContain("3 technologie(s) en commun");
  });

  test("Devrait calculer un score bas pour des profils peu compatibles", () => {
    const currentUser = createMockProfile({
      id: "user-a",
      role_type: "frontend",
      tech_stack: ["React"],
      city: "Brazzaville",
      experience_level: "junior",
    });

    const candidate = createMockProfile({
      id: "user-b",
      role_type: "frontend", // pas complémentaire (0)
      tech_stack: ["Vue.js", "Python"], // 0 techs communes (0)
      city: "Pointe-Noire", // pas la même ville (0)
      experience_level: "senior", // diff 2 (junior/senior) -> pas compatible (0)
      open_to_collaboration: true, // +10 points
    });

    const results = calculateMatches(currentUser, [candidate]);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(10); // uniquement open_to_collaboration
    expect(results[0].reasons).toHaveLength(0);
  });
});
