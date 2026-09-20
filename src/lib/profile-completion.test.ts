import { describe, it, expect } from "vitest";
import { getProfileCompletion } from "./profile-completion";

const complet = {
  full_name: "Kalel Damba",
  bio: "Je construis des outils pour la communauté tech congolaise, à Brazzaville.",
  city: "Brazzaville",
  avatar_url: "https://example.test/a.png",
  github_url: "https://github.com/kxlsys",
  tech_stack: ["React", "Supabase"],
  role_type: "fullstack",
};

describe("getProfileCompletion", () => {
  it("ne signale rien sur un profil complet", () => {
    const result = getProfileCompletion(complet);
    expect(result.missing).toEqual([]);
    expect(result.percent).toBe(100);
    expect(result.isComplete).toBe(true);
  });

  it("met les manques bloquants en tête", () => {
    const result = getProfileCompletion({
      ...complet,
      tech_stack: [],
      city: "",
      avatar_url: "",
    });

    expect(result.missing[0].id).toBe("tech_stack");
    expect(result.missing[1].id).toBe("city");
    expect(result.missing.filter((m) => m.blocking).map((m) => m.id)).toEqual([
      "tech_stack",
      "city",
    ]);
  });

  it("ignore les technologies vides", () => {
    const result = getProfileCompletion({ ...complet, tech_stack: ["", "  "] });
    expect(result.missing.map((m) => m.id)).toContain("tech_stack");
  });

  it("réclame une bio digne de ce nom, pas trois caractères", () => {
    const result = getProfileCompletion({ ...complet, bio: "Dev" });
    expect(result.missing.map((m) => m.id)).toContain("bio");
  });

  it("traite les espaces seuls comme un champ vide", () => {
    const result = getProfileCompletion({ ...complet, city: "   " });
    expect(result.missing.map((m) => m.id)).toContain("city");
  });

  it("supporte les champs absents ou nuls", () => {
    const result = getProfileCompletion({});
    expect(result.missing).toHaveLength(5);
    expect(result.percent).toBe(0);
    expect(result.isComplete).toBe(false);
  });

  it("calcule une progression cohérente", () => {
    const result = getProfileCompletion({ ...complet, github_url: "" });
    expect(result.missing).toHaveLength(1);
    expect(result.percent).toBe(80);
  });

  it("explique la conséquence de chaque manque", () => {
    for (const manque of getProfileCompletion({}).missing) {
      expect(manque.consequence.length).toBeGreaterThan(20);
      expect(manque.label.length).toBeGreaterThan(0);
    }
  });
});
