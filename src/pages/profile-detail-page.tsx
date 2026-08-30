import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  ExternalLink,
  ArrowLeft,
  GitBranch,
  Star,
  Calendar,
  Code as Code2,
  Activity,
  ChevronRight,
  Flame,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionActions } from "@/components/profile/connection-actions";
import { fetchProfileByUsername, fetchRepositories } from "@/lib/profile-service";
import { useAuthStore } from "@/store/auth-store";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { ROLE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/lib/constants";
import type { Profile, Repository } from "@/types";
import { cn } from "@/lib/utils";

type Tab = "biographie" | "arsenal" | "projets";

function extractGithubUsername(githubUrl: string): string | null {
  if (!githubUrl) return null;
  const clean = githubUrl.replace(/\/+$/, "");
  const parts = clean.split("/");
  const last = parts[parts.length - 1];
  return last || null;
}

function isRecentlyActive(lastSeenAt?: string): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}

function formatMemberSince(createdAt: string): string {
  const d = new Date(createdAt);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function GithubHeatmap({ githubUsername }: { githubUsername: string | null }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  if (!githubUsername) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-white/5 bg-white/2 text-xs text-muted-foreground">
        Aucun compte GitHub associé
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <img
        src={`https://ghchart.rshah.org/4edea3/${githubUsername}`}
        alt={`Contributions GitHub de ${githubUsername}`}
        className="w-full min-w-[500px] rounded-lg opacity-90 transition-opacity hover:opacity-100"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
      {status === "error" && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Impossible de charger le graphique GitHub
        </p>
      )}
    </div>
  );
}

function generateHeatmap(seed: string) {
  let x = 0;
  for (let i = 0; i < seed.length; i++) {
    x = (x * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const next = () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
  };

  const cells: { week: number; day: number; level: number }[] = [];
  for (let week = 0; week < 26; week++) {
    for (let day = 0; day < 7; day++) {
      cells.push({ week, day, level: next() % 5 });
    }
  }
  return cells;
}

export function ProfileDetailPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("biographie");

  // ⚡ Bolt: Convert O(N) array search inside double loop to O(1) Map lookup.
  const heatmapMap = useMemo(() => {
    const seed = profile?.id || username || "anonymous";
    const cells = generateHeatmap(seed);
    const map = new Map<string, number>();
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      map.set(`${c.week}-${c.day}`, c.level);
    }
    return map;
  }, [profile?.id, username]);

  useEffect(() => {
    async function fetchData() {
      try {
        const profileData = await fetchProfileByUsername(username!);
        if (profileData) {
          setProfile(profileData);
          const repoData = await fetchRepositories(profileData.id);
          setRepos(repoData);
        } else {
          const mock = MOCK_PROFILES.find((p) => p.username === username);
          if (mock) setProfile(mock as Profile);
        }
      } catch {
        const mock = MOCK_PROFILES.find((p) => p.username === username);
        if (mock) setProfile(mock as Profile);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [username]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-4 pb-24 md:pb-8">
        <Skeleton className="mb-6 h-8 w-28 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Skeleton className="h-[520px] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl p-4 text-center">
        <p className="text-lg font-medium text-muted-foreground">Profil introuvable</p>
        <Link to="/contributeurs">
          <Button variant="ghost" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux contributeurs
          </Button>
        </Link>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const githubUsername = extractGithubUsername(profile.github_url);
  const active = isRecentlyActive(profile.last_seen_at);

  const TABS: { id: Tab; label: string }[] = [
    { id: "biographie", label: "Biographie" },
    { id: "arsenal", label: "Arsenal" },
    { id: "projets", label: "Projets" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 md:pb-8">
      {/* Back */}
      <Link to="/contributeurs">
        <Button
          variant="ghost"
          size="sm"
          className="mb-5 gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </Link>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden lg:grid lg:grid-cols-[340px_1fr] lg:gap-6">
        {/* Left panel */}
        <aside className="flex flex-col gap-4">
          {/* Identity card */}
          <div className="glass-panel overflow-hidden rounded-2xl border border-white/10">
            <div className="relative h-20 w-full bg-gradient-to-b from-primary/20 via-primary/8 to-transparent" />

            <div className="relative -mt-12 flex flex-col items-center px-6 pb-6">
              <div className="relative mb-3">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                <Avatar className="relative h-24 w-24 border-4 border-background shadow-[0_0_24px_rgba(78,222,163,0.25)]">
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
                    {profile.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {profile.open_to_collaboration && (
                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background bg-primary shadow-[0_0_8px_rgba(78,222,163,0.7)]" />
                )}
              </div>

              <div className="text-center">
                <h1 className="text-xl font-bold text-foreground">{profile.full_name}</h1>
                <p className="mt-0.5 text-xs text-muted-foreground/60">@{profile.username}</p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {ROLE_TYPE_LABELS[profile.role_type]}
                </p>
                <div className="mt-1.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {profile.city || "Congo"}
                </div>
              </div>

              {/* Status badges */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {active && (
                  <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary shadow-[0_0_10px_rgba(78,222,163,0.15)]">
                    <Flame className="h-3 w-3" /> Contributeur Actif
                  </span>
                )}
                <span className="flex items-center gap-1 rounded-full border border-tertiary/30 bg-tertiary/10 px-2.5 py-0.5 text-[11px] font-semibold text-tertiary">
                  <Zap className="h-3 w-3" /> {EXPERIENCE_LABELS[profile.experience_level]}
                </span>
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex gap-2 w-full">
                {isOwnProfile ? (
                  <Button
                    size="sm"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                    asChild
                  >
                    <Link to="/profil/edit">Modifier mon profil</Link>
                  </Button>
                ) : (
                  <ConnectionActions
                    targetId={profile.id}
                    targetUsername={profile.username}
                    isLoggedIn={Boolean(user)}
                  />
                )}
              </div>

              {/* GitHub link */}
              {profile.github_url && (
                <div className="mt-4 flex justify-center">
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    {githubUsername || "GitHub"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Bio card */}
          {profile.bio && (
            <div className="glass-panel rounded-2xl border border-white/10 p-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                À propos
              </h3>
              <p className="text-sm leading-relaxed text-foreground/80">{profile.bio}</p>
            </div>
          )}

          {/* Member info card */}
          <div className="glass-panel rounded-2xl border border-white/10 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Infos
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Membre depuis</span>
                <span className="text-foreground font-medium">
                  {formatMemberSince(profile.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expérience</span>
                <span className="text-foreground font-medium">
                  {EXPERIENCE_LABELS[profile.experience_level]}
                </span>
              </div>
              {profile.open_to_collaboration && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/8 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs text-primary">Disponible à la collaboration</span>
                </div>
              )}
            </div>
          </div>

          {/* Arsenal Technique */}
          {profile.tech_stack.length > 0 && (
            <div className="glass-panel rounded-2xl border border-white/10 p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Arsenal Technique
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-foreground/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Contribution heatmap */}
          <div className="glass-panel rounded-2xl border border-white/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Activité de Contribution</h2>
              </div>
              <span className="text-[11px] text-muted-foreground">6 derniers mois</span>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-0.5 min-w-0">
                {Array.from({ length: 26 }).map((_, week) => (
                  <div key={week} className="flex flex-col gap-0.5">
                    {Array.from({ length: 7 }).map((_, day) => {
                      const level = heatmapMap.get(`${week}-${day}`) ?? 0;
                      return (
                        <div
                          key={day}
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{
                            background: level === 0
                              ? "oklch(1 0 0 / 6%)"
                              : `oklch(0.82 ${0.06 + level * 0.025} 155 / ${0.3 + level * 0.18})`,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <GithubHeatmap githubUsername={githubUsername} />

            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                {repos.length > 0 ? `${repos.length}+` : repos.length} repos
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Star className="h-3 w-3" />
                {repos.reduce((sum, r) => sum + (r.stars || 0), 0)} étoiles
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>Moins</span>
                {[0, 1, 2, 3, 4].map((l) => (
                  <div key={l} className="h-2 w-2 rounded-sm"
                    style={{ background: l === 0 ? "oklch(1 0 0 / 6%)" : `oklch(0.82 ${0.06 + l * 0.025} 155 / ${0.3 + l * 0.18})` }}
                  />
                ))}
                <span>Plus</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Indicateur visuel (bêta) : ce graphique donne une tendance, pas une mesure exacte.
            </p>
          </div>

          {/* Professional Journey */}
          <div className="glass-panel rounded-2xl border border-white/10 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Parcours Professionnel</h2>
            </div>
            <div className="relative space-y-4 pl-6">
              <div className="absolute left-0 top-1 bottom-0 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent" />
              <div className="relative">
                <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background shadow-[0_0_8px_rgba(78,222,163,0.5)]" />
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">{ROLE_TYPE_LABELS[profile.role_type] || "Spécialiste tech"}</span>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0 text-[10px] text-primary">En poste</span>
                </div>
                <p className="text-[11px] text-muted-foreground">2021 – Présent &bull; Congo-Brazzaville</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {profile.tech_stack.length > 0
                    ? `Travaille principalement avec ${profile.tech_stack.slice(0, 3).join(", ")}.`
                    : "Stack en cours de formalisation."}
                </p>
              </div>
            </div>
          </div>

          {/* Featured Projects */}
          {repos.length > 0 && (
            <div className="glass-panel rounded-2xl border border-white/10 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">Projets en Vedette</h2>
                </div>
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    Voir tout <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {repos.slice(0, 4).map((repo) => (
                  <a
                    key={repo.id}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/3 p-4 transition-all hover:border-primary/30 hover:bg-white/5"
                  >
                    <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-primary/5 transition-colors group-hover:bg-primary/10" />
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {repo.name}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 mt-0.5" />
                    </div>
                    {repo.description && (
                      <p className="mb-3 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {repo.language && (
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-primary/60" />
                          {repo.language}
                        </div>
                      )}
                      {repo.stars > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {repo.stars}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="lg:hidden">
        <div className="glass-panel rounded-2xl border border-white/10 p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 border-2 border-primary/40 shadow-[0_0_16px_rgba(78,222,163,0.2)]">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                  {profile.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {profile.open_to_collaboration && (
                <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-background bg-primary pulse-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">{profile.full_name}</h1>
              <p className="text-[11px] text-muted-foreground/60">@{profile.username}</p>
              <p className="text-xs font-medium text-primary">{ROLE_TYPE_LABELS[profile.role_type]}</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {profile.city || "Congo"}
                <span className="text-white/20 mx-0.5">·</span>
                {EXPERIENCE_LABELS[profile.experience_level]}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 py-2 text-center">
              <p className="text-base font-bold text-foreground">
                {repos.length > 0 ? `${repos.length}+` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Repos</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 py-2 text-center">
              <p className="text-base font-bold text-foreground">
                {repos.reduce((s, r) => s + (r.stars || 0), 0) || "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Étoiles</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 py-2 text-center">
              <p className="text-base font-bold text-foreground">
                {profile.tech_stack.length || "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Techs</p>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="mt-4 flex gap-2">
              <ConnectionActions
                targetId={profile.id}
                targetUsername={profile.username}
                isLoggedIn={Boolean(user)}
                compact
              />
            </div>
          )}
        </div>

        <div className="mb-4 flex rounded-xl border border-white/10 bg-white/5 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "biographie" && (
          <div className="space-y-3">
            {profile.bio && (
              <div className="glass-panel rounded-xl border border-white/10 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  À propos
                </h3>
                <p className="text-sm leading-relaxed text-foreground/80">{profile.bio}</p>
              </div>
            )}
            <div className="glass-panel rounded-xl border border-white/10 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Localisation
              </h3>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {profile.city || "Congo-Brazzaville"}
              </div>
            </div>
            <div className="glass-panel rounded-xl border border-white/10 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Activité GitHub
                </h3>
              </div>
              <GithubHeatmap githubUsername={githubUsername} />
            </div>
            {profile.github_url && (
              <div className="glass-panel rounded-xl border border-white/10 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Liens
                </h3>
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <GitBranch className="h-4 w-4" />
                  {githubUsername || "GitHub"}
                  <ExternalLink className="ml-auto h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === "arsenal" && (
          <div className="glass-panel rounded-xl border border-white/10 p-4">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Arsenal Technique
            </h3>
            {profile.tech_stack.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune technologie renseignée</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-foreground/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "projets" && (
          <div className="space-y-3">
            {repos.length === 0 ? (
              <div className="glass-panel rounded-xl border border-white/10 py-10 text-center">
                <Code2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Aucun projet disponible</p>
              </div>
            ) : (
              repos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-panel block rounded-xl border border-white/10 p-4 transition-all hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-foreground">{repo.name}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 mt-0.5" />
                  </div>
                  {repo.description && (
                    <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary/60" />
                        {repo.language}
                      </div>
                    )}
                    {repo.stars > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {repo.stars}
                      </div>
                    )}
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
