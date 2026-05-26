import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Handshake,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import type { Profile } from "@/types";

// Inline GitHub icon (lucide-react ne fournit pas `Github`)
const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterPanel } from "@/components/filters/filter-panel";
import { useFilteredProfiles } from "@/hooks/use-filtered-profiles";
import { useFilterStore } from "@/store/filter-store";
import { ROLE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";

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

function formatLastSeen(lastSeenAt?: string): string | null {
  if (!lastSeenAt) return null;
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "Actif aujourd'hui";
  if (days <= 7) return `Actif il y a ${days}j`;
  if (days <= 30) return `Actif il y a ${Math.floor(days / 7)} sem.`;
  return null;
}

const ProfileCard = React.memo(function ProfileCard({ profile }: { profile: Profile }) {
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
                <GithubIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
});

export function ContributorsPage() {
  const { profiles, isLoading, total, page, totalPages, setPage } =
    useFilteredProfiles({ pageSize: 18 });
  const { techStack, searchQuery, setTechStack, setSearchQuery } = useFilterStore();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch, searchQuery, setSearchQuery]);

  if (isLoading && page === 1) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-8">
        <Skeleton className="mb-6 h-10 w-72 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-8">
      {/* Page header */}
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
          size="sm"
          onClick={() => setMobileFilterOpen(true)}
          className="gap-2 border border-white/10 bg-white/5 text-xs lg:hidden"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtres
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, competence..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white/5 border-white/10 pl-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Quick filter chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {QUICK_FILTERS.map((tech) => {
          const isActive = techStack.includes(tech);
          return (
            <button
              key={tech}
              onClick={() => {
                if (isActive) {
                  setTechStack(techStack.filter((t) => t !== tech));
                } else {
                  setTechStack([...techStack, tech]);
                }
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
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

      {/* Sidebar + grid */}
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <FilterPanel />
          </div>
        </aside>

        <div>
          {/* Talent grid — large cards on desktop, list-style on mobile */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}

            {profiles.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center">
                <Handshake className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="font-semibold text-muted-foreground">Aucun contributeur trouve</p>
                <p className="mt-1 text-sm text-muted-foreground/60">Essayez de modifier vos filtres</p>
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
                Precedent
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

      {/* Mobile filter drawer */}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileFilterOpen(false)}
                className="h-7 w-7 p-0 hover:bg-white/5"
              >
                ×
              </Button>
            </div>
            <div className="px-4 pb-6">
              <FilterPanel />
            </div>
            <div
              className="sticky bottom-0 border-t border-white/10 p-4"
              style={{ background: "oklch(0.12 0.025 235 / 98%)" }}
            >
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setMobileFilterOpen(false)}
              >
                Voir {profiles.length} resultat{profiles.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
