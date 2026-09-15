import { describe, it, expect } from "vitest";
import {
  DEFAULT_OG_IMAGE,
  ROLE_SHARE_LABELS,
  buildProfileMeta,
  escapeHtmlAttribute,
  renderMetaDocument,
  truncate,
} from "./page-meta";
import { ROLE_TYPE_LABELS } from "./constants";

describe("ROLE_SHARE_LABELS", () => {
  it("reste identique au référentiel des métiers", () => {
    // Le module de partage duplique ces libellés pour rester importable depuis
    // la fonction edge. Ce test rend toute divergence impossible à manquer.
    expect(ROLE_SHARE_LABELS).toEqual(ROLE_TYPE_LABELS);
  });
});

describe("truncate", () => {
  it("laisse un texte court intact", () => {
    expect(truncate("Dev à Brazzaville", 50)).toBe("Dev à Brazzaville");
  });

  it("coupe sur un mot entier", () => {
    const result = truncate("Développeur backend passionné de systèmes distribués", 30);
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toMatch(/\s…$/);
  });

  it("normalise les espaces et les retours à la ligne", () => {
    expect(truncate("  Dev\n\n  backend  ", 50)).toBe("Dev backend");
  });
});

describe("buildProfileMeta", () => {
  const base = {
    username: "kxlsys",
    full_name: "Kalel Damba",
    role_type: "fullstack",
    city: "Brazzaville",
    bio: "Je construis des outils pour la communauté tech congolaise.",
    avatar_url: "https://example.test/avatar.png",
    tech_stack: ["React", "Supabase"],
  };

  it("met le nom, le métier et la ville dans le titre", () => {
    const meta = buildProfileMeta(base);
    expect(meta.title).toBe("Kalel Damba — Fullstack · Brazzaville | BisoMapTech");
  });

  it("utilise la bio comme description", () => {
    expect(buildProfileMeta(base).description).toBe(base.bio);
  });

  it("se rabat sur la stack quand la bio est vide", () => {
    const meta = buildProfileMeta({ ...base, bio: "" });
    expect(meta.description).toContain("React, Supabase");
  });

  it("se rabat sur une phrase générique sans bio ni stack", () => {
    const meta = buildProfileMeta({ ...base, bio: "", tech_stack: [] });
    expect(meta.description).toContain("Kalel Damba");
  });

  it("retombe sur le nom d'utilisateur quand le nom complet manque", () => {
    const meta = buildProfileMeta({ ...base, full_name: "" });
    expect(meta.title).toContain("kxlsys");
  });

  it("prend l'avatar en image, en carte carrée", () => {
    const meta = buildProfileMeta(base);
    expect(meta.image).toBe(base.avatar_url);
    expect(meta.card).toBe("summary");
  });

  it("utilise l'image du site quand le profil n'a pas d'avatar", () => {
    const meta = buildProfileMeta({ ...base, avatar_url: "" });
    expect(meta.image).toBe(DEFAULT_OG_IMAGE);
    expect(meta.card).toBe("summary_large_image");
  });

  it("construit une URL canonique encodée", () => {
    const meta = buildProfileMeta({ ...base, username: "jean luc" });
    expect(meta.url).toBe("https://bisomaptech.vercel.app/contributeurs/jean%20luc");
  });
});

describe("escapeHtmlAttribute", () => {
  it("neutralise les caractères qui casseraient un attribut", () => {
    expect(escapeHtmlAttribute('a"b<c>d&e\'f')).toBe(
      "a&quot;b&lt;c&gt;d&amp;e&#39;f"
    );
  });
});

describe("renderMetaDocument", () => {
  it("échappe le contenu d'un profil hostile", () => {
    const meta = buildProfileMeta({
      username: "pirate",
      full_name: '"><script>alert(1)</script>',
      role_type: "backend",
      city: "Pointe-Noire",
      bio: "",
      avatar_url: "",
      tech_stack: [],
    });

    const html = renderMetaDocument(meta);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("porte les balises que lisent les robots d'aperçu", () => {
    const html = renderMetaDocument(buildProfileMeta({ username: "kxlsys" }));

    for (const needle of [
      'property="og:title"',
      'property="og:description"',
      'property="og:image"',
      'property="og:url"',
      'name="twitter:card"',
      'rel="canonical"',
    ]) {
      expect(html).toContain(needle);
    }
  });

  it("renvoie un humain vers l'application", () => {
    const meta = buildProfileMeta({ username: "kxlsys" });
    const html = renderMetaDocument(meta);
    expect(html).toContain(`url=${meta.url}`);
  });
});
