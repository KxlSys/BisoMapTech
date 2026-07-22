import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Handshake,
  LogIn,
  MapPin,
  Zap,
  Briefcase,
  Users,
  Sparkles,
  ArrowRight,
  DollarSign,
  Clock,
  ChevronDown,
  CheckCircle2,
  MessageSquare,
  UserPlus,
  Lock,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConnectionActions } from "@/components/profile/connection-actions";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { calculateMatches, calculateProjectMatches, type MatchResult } from "@/lib/matching";
import { fetchProjects } from "@/lib/project-service";
import {
  listIncomingRequests,
  listAcceptedConnections,
  partnerOf,
} from "@/lib/connection-service";
import { MOCK_PROFILES } from "@/lib/mock-data";
import type { Profile, Project, ProjectMatch, ConnectionWithProfiles } from "@/types";
import type { User } from "@supabase/supabase-js";
import { ROLE_TYPE_LABELS, EXPERIENCE_LABELS, DB_ROLE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "talents", label: "Talents", icon: Zap },
  { id: "projets", label: "Projets", icon: Briefcase },
  { id: "connexions", label: "Connexions", icon: Users },
] as const;
type TabId = (typeof TABS)[number]["id"];

// Built from the canonical role list so every discipline on the platform
// (systèmes, cybersécurité, support, design, hardware…) is filterable — not
// just the web/app dev roles.
const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "Tous" },
  ...DB_ROLE_TYPES.map((value) => ({ value, label: ROLE_TYPE_LABELS[value] })),
];

const PRIORITY_STYLE: Record<string, string> = {
  "Priorité Haute": "border-primary/40 bg-primary/10 text-primary",
  "Long Terme": "border-tertiary/40 bg-tertiary/10 text-tertiary",
  Actif: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  Urgent: "border-red-400/40 bg-red-400/10 text-red-300",
  Ouvert: "border-white/20 bg-white/5 text-muted-foreground",
};

const PRIORITY_DOT: Record<string, string> = {
  "Priorité Haute": "bg-primary shadow-[0_0_6px_rgba(78,222,163,0.7)]",
  "Long Terme": "bg-tertiary",
  Actif: "bg-orange-400",
  Urgent: "bg-red-400",
  Ouvert: "bg-white/50",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MatchingPage() {
  const { user, profile, signInWithGitHub } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("vue") as TabId) ?? "talents";

  function setTab(tab: TabId) {
    setSearchParams({ vue: tab });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-8">
      {/* Auth banner */}
      {!user && (
        <div className="mb-6 flex flex-col items-start gap-3 rounded-2xl border border-primary/30 bg-primary/8 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Aperçu — données fictives</p>
            <p className="text-xs text-muted-foreground">
              Connectez-vous pour voir vos correspondances personnalisées et contacter des talents.
            </p>
          </div>
          <Button
            onClick={signInWithGitHub}
            size="sm"
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-semibold"
          >
            <LogIn className="h-3.5 w-3.5" />
            Se connecter
          </Button>
        </div>
      )}

      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Matching
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Talents, projets et connexions de l'écosystème tech congolais.
          </p>
        </div>
        {user ? (
          <Link to="/projet/nouveau">
            <Button
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-[0_4px_16px_rgba(78,222,163,0.2)]"
            >
              <Briefcase className="h-4 w-4" />
              Déposer un Projet
            </Button>
          </Link>
        ) : (
          <Button
            size="sm"
            disabled
            title="Connectez-vous pour déposer un projet"
            className="gap-2 cursor-not-allowed opacity-50 font-semibold"
          >
            <Lock className="h-4 w-4" />
            Déposer un Projet
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              activeTab === tab.id
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(78,222,163,0.3)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "talents" && (
        <TalentsTab user={user} profile={profile} signInWithGitHub={signInWithGitHub} />
      )}
      {activeTab === "projets" && (
        <ProjetsTab user={user} profile={profile} />
      )}
      {activeTab === "connexions" && (
        <ConnexionsTab user={user} />
      )}
    </div>
  );
}

// ─── Tab: Talents ─────────────────────────────────────────────────────────────

function TalentsTab({
  user,
  profile,
  signInWithGitHub,
}: {
  user: User | null;
  profile: Profile | null;
  signInWithGitHub: () => void;
}) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [disponibleOnly, setDisponibleOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const profilesCache = useRef<Profile[] | null>(null);

  const mockMatches = useMemo(
    () => calculateMatches(MOCK_PROFILES[0], MOCK_PROFILES.slice(1) as Profile[]),
    []
  );

  const loadMatches = useCallback(async () => {
    if (!profile) return;
    if (!profilesCache.current) {
      const { data } = await supabase.from("profiles").select("*");
      profilesCache.current =
        data && data.length > 0 ? (data as Profile[]) : (MOCK_PROFILES as Profile[]);
    }
    setMatches(
      calculateMatches(
        profile,
        profilesCache.current.filter((p) => p.id !== profile.id)
      )
    );
  }, [profile]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const baseMatches = user && matches.length > 0 ? matches : mockMatches;

  const filtered = useMemo(() => {
    return baseMatches.filter((m) => {
      if (roleFilter !== "all" && m.profile.role_type !== roleFilter) return false;
      if (disponibleOnly && !m.profile.open_to_collaboration) return false;
      return true;
    });
  }, [baseMatches, roleFilter, disponibleOnly]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-5">
      {/* Mini-filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {ROLE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                roleFilter === opt.value
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDisponibleOnly(!disponibleOnly)}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
            disponibleOnly
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", disponibleOnly ? "bg-primary animate-pulse" : "bg-white/30")} />
          Disponibles
        </button>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} talent{filtered.length !== 1 ? "s" : ""} correspondant{filtered.length !== 1 ? "s" : ""}
        {!user && <span className="ml-1 text-muted-foreground/50">(aperçu)</span>}
      </p>

      {/* Talent cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((match) => (
          <TalentCard key={match.profile.id} match={match} isLoggedIn={!!user} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Handshake className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Aucun talent pour ces filtres</p>
          <button
            onClick={() => { setRoleFilter("all"); setDisponibleOnly(false); }}
            className="mt-2 text-xs text-primary hover:underline underline-offset-2"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Load more */}
      {visibleCount < filtered.length && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount((n) => n + 6)}
            className="gap-2 border border-white/10 bg-white/5 hover:bg-white/8"
          >
            <ChevronDown className="h-4 w-4" />
            Voir plus ({filtered.length - visibleCount} restants)
          </Button>
        </div>
      )}

      {!user && (
        <div className="rounded-xl border border-white/10 bg-white/3 px-5 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{Math.max(0, baseMatches.length - 6)}</span> autres talents visibles après connexion
          </p>
          <button
            onClick={signInWithGitHub}
            className="mt-1 text-xs font-medium text-primary hover:underline underline-offset-2"
          >
            Se connecter →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Talent Card ──────────────────────────────────────────────────────────────

const TalentCard = React.memo(function TalentCard({ match, isLoggedIn }: { match: MatchResult; isLoggedIn: boolean }) {
  const { profile, score, reasons } = match;

  return (
    <div className="glass-panel group relative flex flex-col overflow-hidden rounded-xl border border-white/10 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(78,222,163,0.08)]">
      <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-map-accent to-primary opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 border-2 border-white/10 transition-colors group-hover:border-primary/40">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {profile.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {profile.open_to_collaboration && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-background">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/contributeurs/${profile.username}`}
              className="truncate text-sm font-semibold text-foreground transition-colors hover:text-primary group-hover:text-primary"
            >
              {profile.full_name}
            </Link>
            <div className="flex shrink-0 items-center gap-1 rounded border border-map-accent/30 bg-map-accent/10 px-2 py-0.5 text-[11px] font-bold text-map-accent">
              <Zap className="h-2.5 w-2.5" />
              {score}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {ROLE_TYPE_LABELS[profile.role_type]} · {EXPERIENCE_LABELS[profile.experience_level]}
          </p>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{profile.city || "Congo"}</span>
          </div>
        </div>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {reasons.map((r) => (
            <span
              key={r}
              className="rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary/80"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Tech tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {profile.tech_stack.slice(0, 3).map((tech) => (
          <span key={tech} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
            {tech}
          </span>
        ))}
        {profile.tech_stack.length > 3 && (
          <span className="text-[10px] text-muted-foreground/50">+{profile.tech_stack.length - 3}</span>
        )}
      </div>

      {/* CTA */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <ConnectionActions
          targetId={profile.id}
          targetUsername={profile.username}
          isLoggedIn={isLoggedIn}
          compact
        />
      </div>
    </div>
  );
});

// ─── Tab: Projets ─────────────────────────────────────────────────────────────

function ProjetsTab({
  user,
  profile,
}: {
  user: User | null;
  profile: Profile | null;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMatches, setProjectMatches] = useState<ProjectMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [interested, setInterested] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data);
      if (profile) {
        setProjectMatches(calculateProjectMatches(profile, data));
      }
      setIsLoading(false);
    });

    if (user) {
      // Charger les intérêts réels depuis la table project_members
      supabase
        .from("project_members")
        .select("project_id")
        .eq("profile_id", user.id)
        .then(({ data, error }) => {
          if (!error && data) {
            setInterested(new Set(data.map((d) => d.project_id)));
          }
        });
    }
  }, [profile, user]);

  const handleInterest = useCallback(async (projectId: string) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour exprimer votre intérêt.");
      return;
    }

    const isCurrentlyInterested = interested.has(projectId);
    if (isCurrentlyInterested) {
      // Quitter le groupe de projet
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("profile_id", user.id);

      if (!error) {
        setInterested((prev) => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
        toast.success("Vous n'êtes plus inscrit à ce projet.");
      } else {
        toast.error("Impossible de se désinscrire.");
      }
    } else {
      // Rejoindre le groupe de projet comme collaborateur
      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          profile_id: user.id,
          role: "collaborator"
        });

      if (!error) {
        setInterested((prev) => {
          const next = new Set(prev);
          next.add(projectId);
          return next;
        });
        toast.success("Vous avez rejoint le groupe de projet !", {
          description: "Retrouvez la discussion d'équipe sous l'onglet Groupes de Projets dans vos Messages.",
        });
      } else {
        if (error.code === "PGRST116" || error.message?.includes("relation")) {
          toast.error("La base de données n'a pas encore été configurée pour le chat de groupe.");
        } else {
          toast.error("Impossible de rejoindre le projet.");
        }
      }
    }
  }, [user, interested]);

  // ⚡ Bolt: Memoize the mapping logic to prevent O(N) object allocations on every render
  // This avoids redundant work when local interactive states (like visibleCount or interested) change.
  // Impact: Reduces main-thread blocking during re-renders by caching derived datasets.
  const displayList: { project: Project; score?: number; reasons?: string[] }[] = useMemo(() => {
    return profile && projectMatches.length > 0
      ? projectMatches.map((m) => ({ project: m.project, score: m.score, reasons: m.reasons }))
      : projects.map((p) => ({ project: p }));
  }, [profile, projectMatches, projects]);

  // ⚡ Bolt: Memoize slicing to prevent re-instantiating the visible array on unrelated renders.
  const visible = useMemo(() => displayList.slice(0, visibleCount), [displayList, visibleCount]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-xl border border-white/10 bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-muted-foreground">
        {displayList.length} projet{displayList.length !== 1 ? "s" : ""} disponible{displayList.length !== 1 ? "s" : ""}
        {profile && projectMatches.length > 0 && (
          <span className="ml-1 text-primary/70">· triés par compatibilité</span>
        )}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map(({ project, score, reasons }) => (
          <ProjectCard
            key={project.id}
            project={project}
            score={score}
            reasons={reasons}
            isLoggedIn={!!user}
            isInterested={interested.has(project.id)}
            onInterest={() => handleInterest(project.id)}
          />
        ))}
      </div>

      {displayList.length === 0 && (
        <div className="py-16 text-center">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Aucun projet disponible</p>
        </div>
      )}

      {visibleCount < displayList.length && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount((n) => n + 6)}
            className="gap-2 border border-white/10 bg-white/5 hover:bg-white/8"
          >
            <ChevronDown className="h-4 w-4" />
            Voir plus ({displayList.length - visibleCount} restants)
          </Button>
        </div>
      )}

      {user && (
        <div className="mt-2 rounded-xl border border-white/10 bg-white/3 px-5 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Vous avez un projet ? Publiez-le pour trouver les talents qui correspondent.
          </p>
          <Link to="/projet/nouveau" className="mt-1 inline-block text-xs font-medium text-primary hover:underline underline-offset-2">
            Déposer mon projet →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

const ProjectCard = React.memo(function ProjectCard({
  project,
  score,
  reasons,
  isLoggedIn,
  isInterested,
  onInterest,
}: {
  project: Project;
  score?: number;
  reasons?: string[];
  isLoggedIn: boolean;
  isInterested: boolean;
  onInterest: () => void;
}) {
  const priority = project.priority ?? "Ouvert";
  const priorityClass = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE["Ouvert"];
  const dotClass = PRIORITY_DOT[priority] ?? PRIORITY_DOT["Ouvert"];

  return (
    <div className="glass-panel group relative flex flex-col overflow-hidden rounded-xl border border-white/10 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(78,222,163,0.08)]">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-primary/5 transition-transform duration-300 group-hover:scale-110" />

      <div className="relative flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">{project.title}</h3>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {project.location ?? "Congo"} · {project.project_type ?? "Projet"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${priorityClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotClass} animate-pulse`} />
              {priority}
            </div>
            {score !== undefined && (
              <div className="flex items-center gap-1 rounded border border-map-accent/30 bg-map-accent/10 px-2 py-0.5 text-[10px] font-bold text-map-accent">
                <Zap className="h-2.5 w-2.5" />
                {score}%
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-xs text-muted-foreground">{project.description}</p>

        {/* Reasons */}
        {reasons && reasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reasons.map((r) => (
              <span
                key={r}
                className="rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary/80"
              >
                {r}
              </span>
            ))}
          </div>
        )}

        {/* Tech tags */}
        <div className="flex flex-wrap gap-1">
          {project.tech_stack.slice(0, 4).map((t) => (
            <span key={t} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
              {t}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex flex-col gap-0.5">
            {project.budget && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <DollarSign className="h-3 w-3 shrink-0" />
                {project.budget}
              </div>
            )}
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarClock className="h-3 w-3 shrink-0" />
              {relativeTime(project.created_at)}
            </div>
          </div>

          {isLoggedIn ? (
            <button
              onClick={onInterest}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                isInterested
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-white/15 bg-white/5 text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
              )}
            >
              {isInterested ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Intéressé
                </>
              ) : (
                <>
                  <Handshake className="h-3.5 w-3.5" />
                  Je suis intéressé
                </>
              )}
            </button>
          ) : (
            <Link to="/login">
              <button className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:text-primary">
                <ArrowRight className="h-3.5 w-3.5" />
                Voir
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Tab: Connexions ──────────────────────────────────────────────────────────

function ConnexionsTab({ user }: { user: User | null }) {
  const [incoming, setIncoming] = useState<ConnectionWithProfiles[]>([]);
  const [accepted, setAccepted] = useState<ConnectionWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    Promise.all([
      listIncomingRequests(user.id),
      listAcceptedConnections(user.id),
    ]).then(([inc, acc]) => {
      setIncoming(inc);
      setAccepted(acc);
      setIsLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Users className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour gérer vos demandes et contacts.
        </p>
        <Link to="/login">
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <LogIn className="h-4 w-4" />
            Se connecter
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/5" />
        ))}
      </div>
    );
  }

  const totalPending = incoming.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Incoming requests */}
      <section>
        <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
          <h2 className="text-sm font-semibold text-foreground">Demandes reçues</h2>
          {totalPending > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              {totalPending}
            </span>
          )}
        </div>
        {incoming.length === 0 ? (
          <p className="py-4 text-xs text-muted-foreground">Aucune demande en attente.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {incoming.map((conn) => {
              const partner = partnerOf(user.id, conn);
              if (!partner) return null;
              return (
                <ConnectionRow
                  key={conn.id}
                  partner={partner}
                  userId={user.id}
                  conn={conn}
                  mode="incoming"
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Accepted connections */}
      <section>
        <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
          <h2 className="text-sm font-semibold text-foreground">Mes connexions</h2>
          <span className="text-xs text-muted-foreground">{accepted.length}</span>
        </div>
        {accepted.length === 0 ? (
          <div className="py-8 text-center">
            <UserPlus className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Vous n'avez pas encore de connexions.</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Envoyez des demandes depuis l'onglet Talents.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {accepted.map((conn) => {
              const partner = partnerOf(user.id, conn);
              if (!partner) return null;
              return (
                <ConnectionRow
                  key={conn.id}
                  partner={partner}
                  userId={user.id}
                  conn={conn}
                  mode="connected"
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Connection Row ───────────────────────────────────────────────────────────

const ConnectionRow = React.memo(function ConnectionRow({
  partner,
  conn,
  mode,
}: {
  partner: { id: string; username: string; full_name: string; avatar_url: string };
  userId: string;
  conn: ConnectionWithProfiles;
  mode: "incoming" | "connected";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <Avatar className="h-9 w-9 shrink-0 border border-white/10">
        <AvatarImage src={partner.avatar_url} alt={partner.full_name} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
          {partner.full_name?.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <Link
          to={`/contributeurs/${partner.username}`}
          className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          {partner.full_name}
        </Link>
        <p className="text-[11px] text-muted-foreground">
          {mode === "incoming" ? (
            <>
              <Clock className="inline-block h-2.5 w-2.5 mr-0.5 -mt-0.5" />
              {relativeTime(conn.created_at)}
            </>
          ) : (
            <>
              <CheckCircle2 className="inline-block h-2.5 w-2.5 mr-0.5 -mt-0.5 text-primary" />
              Connecté
            </>
          )}
        </p>
      </div>

      <div className="shrink-0">
        {mode === "incoming" ? (
          <ConnectionActions
            targetId={partner.id}
            targetUsername={partner.username}
            isLoggedIn={true}
            compact
          />
        ) : (
          <Link to={`/messages?to=${partner.username}`}>
            <Button size="sm" variant="ghost" className="h-8 gap-1 border border-white/10 bg-white/5 px-3 text-xs hover:border-primary/30 hover:text-primary">
              <MessageSquare className="h-3.5 w-3.5" />
              Message
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
});
