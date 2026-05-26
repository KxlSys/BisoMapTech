import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Handshake,
  ChevronLeft,
  ChevronRight,
  Github,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterPanel } from "@/components/filters/filter-panel";
import { useFilteredProfiles } from "@/hooks/use-filtered-profiles";
import { useFilterStore } from "@/store/filter-store";
import type { SortBy } from "@/store/filter-store";
import { ROLE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Profile } from "@/types";

// Techs les plus utilisés dans l'écosystème tech congolais
const QUICK_FILTERS = [
  "React",
  "JavaScript",
  "Python",
  "Flutter",
  "Node.js",
  "TypeScript",
  "PHP",
  "Vue.js",
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "default", label: "Tous" },
  { value: "available_first", label: "Disponibles d'abord" },
  { value: "recent", label: "Récemment actifs" },
];

function formatLastSeen(lastSeenAt?: string): string | null {
  if (!lastSeenAt) return null;
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "Actif aujourd'hui";
  if (days <= 7) return `Actif il y a ${days}j`;
  if (days <= 30) return `Actif il y a ${Math.floor(days / 7)} sem.`;
  return null;
}

function ProfileCard({ profile }: { profile: Profile }) {
  const lastSeen = formatLastSeen(profile.last_seen_at);

  return (
    <Link to={`/contributeurs/${profile.username}`}>
      <article className="glass-panel group relative rounded-xl border border-white/10 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(78,222,163,0.08)] active:scale-[0.99] cursor-pointer">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-primary/6 blur-xl transition-colors group-hover:bg-primary/12" />

        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          {/* Avatar + badge disponible */}
          <div className="relative shrink-0">
            <Avatar className="h-14 w-14 border-2 border-white/15">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                {profile.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {profile.open_to_collaboration && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-background">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
              </div>
            )}
          </div>

          {/* Nom + rôle + ville */}
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-sm font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
              {profile.full_name}
            </h3>
            <p className="mt-0.5 text-sm font-medium text-primary">
              {ROLE_TYPE_LABELS[profile.role_type]}
            </p>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{profile.city || "Congo"}</span>
            </div>
            {/* Badge Disponible visible en texte */}
            {profile.open_to_collaboration && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/25 px-2 py-0.5 text-[11px] font-medium text-primary">
                Disponible
              </span>
            )}
          </div>

          {/* Niveau d'expérience */}
          <Badge
            variant="outline"
            className="shrink-0 border-white/10 bg-white/5 text-xs text-muted-foreground"
          >
            {EXPERIENCE_LABELS[profile.experience_level]}
          </Badge>
        </div>

        {/* Techs + GitHub + activité */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3">
          {profile.tech_stack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tech}
            </span>
          ))}
          {profile.tech_stack.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{profile.tech_stack.length - 3}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {lastSeen && (
              <span className="text-[11px] text-muted-foreground/60 hidden sm:inline">
                {lastSeen}
              </span>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground/60 hover:text-primary transition-colors"
                aria-label="Voir profil GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ContributorsPage() {
  const { profiles, isLoading, total, page, totalPages, setPage } =
    useFilteredProfiles({ pageSize: 18 });
  const { techStack, searchQuery, sortBy, setTechStack, setSearchQuery, setSortBy } =
    useFilterStore();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  if (isLoading && page === 1) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-8">
        <Skeleton className="mb-6 h-10 w-72 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-8">
      {/* En-tête */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Contributeurs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString()} talent{total !== 1 ? "s" : ""} tech congolais
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setMobileFilterOpen(true)}
          className="h-10 gap-2 border border-white/10 bg-white/5 text-sm lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, compétence..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white/5 border-white/10 pl-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Quick-chips + tri */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Quick-chips : scroll horizontal sur mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_FILTERS.map((tech) => {
            const isActive = techStack.includes(tech);
            return (
              <button
                key={tech}
                onClick={() =>
                  setTechStack(
                    isActive ? techStack.filter((t) => t !== tech) : [...techStack, tech]
                  )
                }
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_8px_rgba(78,222,163,0.2)]"
                    : "border-white/15 bg-white/5 text-muted-foreground hover:border-white/25 hover:text-foreground"
                )}
              >
                {tech}
              </button>
            );
          })}
        </div>

        {/* Tri */}
        <div className="flex shrink-0 items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                sortBy === opt.value
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-white/15 bg-white/5 text-muted-foreground hover:border-white/25 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar + grille */}
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <FilterPanel hideSearch />
          </div>
        </aside>

        <div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}

            {profiles.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center">
                <Handshake className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="font-semibold text-muted-foreground">Aucun contributeur trouvé</p>
                <p className="mt-1 text-sm text-muted-foreground/60">
                  Essayez de modifier vos filtres
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="gap-1 border border-white/10 bg-white/5 hover:bg-white/8 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="gap-1 border border-white/10 bg-white/5 hover:bg-white/8 disabled:opacity-30"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tiroir de filtres mobile */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[600] flex flex-col lg:hidden">
          <div className="flex-1" onClick={() => setMobileFilterOpen(false)} />
          <div
            className="glass-panel rounded-t-2xl border-t border-white/15 max-h-[85vh] overflow-y-auto"
            style={{ background: "oklch(0.12 0.025 235 / 98%)" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="font-semibold text-sm">Filtres</p>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 text-muted-foreground text-lg"
                aria-label="Fermer les filtres"
              >
                ×
              </button>
            </div>
            <div className="px-4 pb-6">
              <FilterPanel hideSearch />
            </div>
            <div
              className="sticky bottom-0 border-t border-white/10 p-4"
              style={{ background: "oklch(0.12 0.025 235 / 98%)" }}
            >
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setMobileFilterOpen(false)}
              >
                Voir {profiles.length} résultat{profiles.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
