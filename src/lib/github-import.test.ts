import { describe, it, expect, afterEach } from "vitest";
import { matchTechOption, importGithubProfile } from "./github-import";

describe("matchTechOption", () => {
  it("reconnaît un langage GitHub qui porte déjà le nom du référentiel", () => {
    expect(matchTechOption("Python")).toBe("Python");
    expect(matchTechOption("rust")).toBe("Rust");
  });

  it("applique les alias des langages nommés différemment sur GitHub", () => {
    expect(matchTechOption("HTML")).toBe("HTML/CSS");
    expect(matchTechOption("SCSS")).toBe("HTML/CSS");
    expect(matchTechOption("Dockerfile")).toBe("Docker");
    expect(matchTechOption("HCL")).toBe("Terraform");
    expect(matchTechOption("Shell")).toBe("Bash");
  });

  it("ignore la casse et la ponctuation des topics", () => {
    expect(matchTechOption("node-js")).toBe("Node.js");
    expect(matchTechOption("nextjs")).toBe("Next.js");
    expect(matchTechOption("tailwind-css")).toBe("Tailwind CSS");
    expect(matchTechOption("React Native")).toBe("React Native");
  });

  it("renvoie null pour ce qui ne correspond à aucune techno connue", () => {
    expect(matchTechOption("hacktoberfest")).toBeNull();
    expect(matchTechOption("")).toBeNull();
    expect(matchTechOption("   ")).toBeNull();
  });
});

describe("importGithubProfile", () => {
  const originalFetch = globalThis.fetch;

  function mockGithub(
    handlers: Record<string, { status?: number; body?: unknown }>
  ) {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      const key = Object.keys(handlers).find((k) => url.includes(k));
      const handler = key ? handlers[key] : undefined;
      if (!handler) throw new Error(`Appel non simulé : ${url}`);
      return {
        status: handler.status ?? 200,
        ok: (handler.status ?? 200) < 400,
        json: async () => handler.body,
      } as Response;
    }) as typeof fetch;
  }

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("reprend le profil public et pondère le langage principal au-dessus des topics", async () => {
    mockGithub({
      "/users/kxlsys/repos": {
        body: [
          { fork: false, language: "TypeScript", topics: ["react"] },
          { fork: false, language: "TypeScript", topics: [] },
          { fork: false, language: "Python", topics: ["django", "hacktoberfest"] },
        ],
      },
      "/users/kxlsys": {
        body: {
          name: "Kalel Damba",
          bio: "Dev à Brazzaville",
          avatar_url: "https://example.test/a.png",
          blog: "https://example.test",
        },
      },
    });

    const result = await importGithubProfile("kxlsys");

    expect(result.fullName).toBe("Kalel Damba");
    expect(result.bio).toBe("Dev à Brazzaville");
    expect(result.repoCount).toBe(3);
    // TypeScript : 2 dépôts × 3 = 6, devant Python (3) et les topics (1 chacun).
    expect(result.techStack[0]).toBe("TypeScript");
    expect(result.techStack).toContain("Python");
    expect(result.techStack).toContain("React");
    expect(result.techStack).not.toContain("hacktoberfest");
  });

  it("ignore les forks, qui ne disent rien de ce que la personne écrit", async () => {
    mockGithub({
      "/users/kxlsys/repos": {
        body: [
          { fork: true, language: "Go", topics: [] },
          { fork: false, language: "Rust", topics: [] },
        ],
      },
      "/users/kxlsys": { body: { name: "", bio: null, avatar_url: null, blog: null } },
    });

    const result = await importGithubProfile("kxlsys");

    expect(result.repoCount).toBe(1);
    expect(result.techStack).toEqual(["Rust"]);
  });

  it("tronque une bio trop longue à 200 caractères", async () => {
    mockGithub({
      "/users/kxlsys/repos": { body: [] },
      "/users/kxlsys": { body: { bio: "x".repeat(400) } },
    });

    const result = await importGithubProfile("kxlsys");

    expect(result.bio).toHaveLength(200);
  });

  it("signale un compte introuvable", async () => {
    mockGithub({
      "/users/inconnu/repos": { status: 404, body: {} },
      "/users/inconnu": { status: 404, body: {} },
    });

    await expect(importGithubProfile("inconnu")).rejects.toThrow(/introuvable/i);
  });

  it("signale le quota d'API atteint", async () => {
    mockGithub({
      "/users/kxlsys/repos": { status: 403, body: {} },
      "/users/kxlsys": { status: 403, body: {} },
    });

    await expect(importGithubProfile("kxlsys")).rejects.toThrow(/quota/i);
  });

  it("refuse un nom d'utilisateur vide sans appeler l'API", async () => {
    await expect(importGithubProfile("   ")).rejects.toThrow(/manquant/i);
  });
});
