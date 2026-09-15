import { TECH_OPTIONS } from "@/lib/constants";

// ======================================================
// IMPORT DEPUIS GITHUB
// ------------------------------------------------------
// L'inscription se fait via GitHub OAuth : on peut donc pré-remplir
// l'onboarding (nom, bio, photo) et déduire une stack technique à partir
// des langages et topics des dépôts publics, plutôt que de faire saisir
// une quinzaine de champs à la main sur mobile.
// ======================================================

const GITHUB_API = "https://api.github.com";
const REPOS_PER_PAGE = 60;

/** Langages / topics GitHub qui ne portent pas le même nom que nos options. */
const TECH_ALIASES: Record<string, string> = {
  html: "HTML/CSS",
  css: "HTML/CSS",
  scss: "HTML/CSS",
  sass: "HTML/CSS",
  vue: "Vue.js",
  nodejs: "Node.js",
  node: "Node.js",
  nextjs: "Next.js",
  reactnative: "React Native",
  dotnet: ".NET",
  csharp: "C#",
  golang: "Go",
  objectivec: "Swift",
  jupyternotebook: "Python",
  shell: "Bash",
  powershell: "Bash",
  dockerfile: "Docker",
  hcl: "Terraform",
  tailwindcss: "Tailwind CSS",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  restapi: "REST API",
  api: "REST API",
};

/** Clé de comparaison insensible à la casse et à la ponctuation. */
function normalizeTechKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const TECH_BY_KEY: Map<string, string> = new Map(
  TECH_OPTIONS.map((tech) => [normalizeTechKey(tech), tech])
);

/** Fait correspondre un langage ou topic GitHub à une techno du référentiel. */
export function matchTechOption(raw: string): string | null {
  const key = normalizeTechKey(raw);
  if (!key) return null;
  const alias = TECH_ALIASES[key];
  if (alias) return alias;
  return TECH_BY_KEY.get(key) ?? null;
}

export interface GithubImportResult {
  fullName: string;
  bio: string;
  avatarUrl: string;
  blog: string;
  /** Technos déduites des dépôts publics, les plus utilisées d'abord. */
  techStack: string[];
  repoCount: number;
}

interface GithubUserResponse {
  name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  blog?: string | null;
}

interface GithubRepoResponse {
  fork?: boolean;
  language?: string | null;
  topics?: string[] | null;
}

export class GithubImportError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GithubImportError";
    this.status = status;
  }
}

async function fetchGithub<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
    signal,
  });

  if (response.status === 404) {
    throw new GithubImportError("Compte GitHub introuvable.", 404);
  }
  // 403/429 : quota d'API atteint (60 requêtes/heure par IP sans jeton),
  // fréquent derrière une IP partagée ou un réseau d'entreprise.
  if (response.status === 403 || response.status === 429) {
    throw new GithubImportError(
      "Quota GitHub atteint, réessayez dans quelques minutes.",
      response.status
    );
  }
  if (!response.ok) {
    throw new GithubImportError(
      `GitHub a répondu ${response.status}.`,
      response.status
    );
  }

  return (await response.json()) as T;
}

/**
 * Récupère le profil public et les dépôts d'un compte GitHub, et en déduit
 * les champs d'onboarding. Les forks sont ignorés : ils reflètent rarement
 * ce que la personne écrit elle-même.
 */
export async function importGithubProfile(
  username: string,
  options: { signal?: AbortSignal; maxTechs?: number } = {}
): Promise<GithubImportResult> {
  const login = username.trim().replace(/^@/, "");
  if (!login) {
    throw new GithubImportError("Nom d'utilisateur GitHub manquant.");
  }

  const encoded = encodeURIComponent(login);
  const [user, repos] = await Promise.all([
    fetchGithub<GithubUserResponse>(`/users/${encoded}`, options.signal),
    fetchGithub<GithubRepoResponse[]>(
      `/users/${encoded}/repos?per_page=${REPOS_PER_PAGE}&sort=updated&direction=desc`,
      options.signal
    ),
  ]);

  const ownRepos = (Array.isArray(repos) ? repos : []).filter((r) => !r.fork);

  // Le langage principal pèse plus lourd qu'un topic déclaratif.
  const weights = new Map<string, number>();
  const bump = (tech: string, weight: number) => {
    weights.set(tech, (weights.get(tech) ?? 0) + weight);
  };

  for (const repo of ownRepos) {
    const language = repo.language ? matchTechOption(repo.language) : null;
    if (language) bump(language, 3);

    for (const topic of repo.topics ?? []) {
      const tech = matchTechOption(topic);
      if (tech) bump(tech, 1);
    }
  }

  const techStack = [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, options.maxTechs ?? 12)
    .map(([tech]) => tech);

  return {
    fullName: user.name?.trim() || "",
    bio: (user.bio ?? "").trim().slice(0, 200),
    avatarUrl: user.avatar_url ?? "",
    blog: (user.blog ?? "").trim(),
    techStack,
    repoCount: ownRepos.length,
  };
}
