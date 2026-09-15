import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Le module lit sa configuration Supabase au chargement : chaque cas réinitialise
 * donc le cache de modules avant d'importer le gestionnaire.
 */
async function loadHandler() {
  vi.resetModules();
  const mod = await import("./share-preview");
  return mod.default;
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe("share-preview", () => {
  it("sert l'aperçu du site quand Supabase n'est pas configuré", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    const handler = await loadHandler();
    const response = await handler(
      new Request("https://bisomaptech.vercel.app/api/share-preview?u=kxlsys")
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("BisoMapTech");
    expect(html).toContain('property="og:image"');
  });

  it("sert le nom, le métier et la ville du profil demandé", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://projet.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "cle-anon");

    let calledUrl = "";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calledUrl = String(input);
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            username: "kxlsys",
            full_name: "Kalel Damba",
            role_type: "fullstack",
            city: "Brazzaville",
            bio: "Je construis des outils pour la communauté tech congolaise.",
            avatar_url: "https://example.test/avatar.png",
            tech_stack: ["React"],
          },
        ],
      } as Response;
    }) as typeof fetch;

    const handler = await loadHandler();
    const response = await handler(
      new Request("https://bisomaptech.vercel.app/api/share-preview?u=kxlsys")
    );
    const html = await response.text();

    expect(calledUrl).toContain("/rest/v1/profiles?username=eq.kxlsys");
    expect(html).toContain("Kalel Damba");
    expect(html).toContain("Fullstack");
    expect(html).toContain("Brazzaville");
    expect(response.headers.get("cache-control")).toContain("s-maxage=3600");
  });

  it("retombe sur l'aperçu du site quand le profil n'existe pas", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://projet.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "cle-anon");

    globalThis.fetch = (async () =>
      ({ ok: true, status: 200, json: async () => [] }) as Response) as typeof fetch;

    const handler = await loadHandler();
    const response = await handler(
      new Request("https://bisomaptech.vercel.app/api/share-preview?u=inconnu")
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain(
      "La carte des talents tech congolais"
    );
  });

  it("ne casse pas quand la base est injoignable", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://projet.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "cle-anon");

    globalThis.fetch = (async () => {
      throw new Error("réseau indisponible");
    }) as typeof fetch;

    const handler = await loadHandler();
    const response = await handler(
      new Request("https://bisomaptech.vercel.app/api/share-preview?u=kxlsys")
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("BisoMapTech");
  });
});
