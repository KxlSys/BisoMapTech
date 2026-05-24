import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFilterStore } from "@/store/filter-store";
import { CONGO_CITIES } from "@/lib/cities";
import { TECH_OPTIONS, ROLE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<string, string> = {
  frontend: "FE",
  backend: "BE",
  fullstack: "FS",
  data: "DA",
  devops: "DO",
  mobile: "MB",
  autre: "AU",
};

export function FilterPanel({ compact = false }: { compact?: boolean }) {
  const {
    searchQuery,
    city,
    techStack,
    roleType,
    experienceLevel,
    openToCollaboration,
    setSearchQuery,
    setCity,
    setTechStack,
    setRoleType,
    setExperienceLevel,
    setOpenToCollaboration,
    resetFilters,
  } = useFilterStore();

  const hasActiveFilters =
    searchQuery || city || techStack.length > 0 || roleType || experienceLevel || openToCollaboration !== null;

  const activeCount = [
    searchQuery,
    city && city !== "all" ? city : null,
    techStack.length > 0 ? techStack : null,
    roleType && roleType !== "all" ? roleType : null,
    experienceLevel && experienceLevel !== "all" ? experienceLevel : null,
    openToCollaboration !== null ? openToCollaboration : null,
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-5", !compact && "glass-panel rounded-xl border border-white/10 p-4")}>
      {/* Header — only shown when not compact (standalone use) */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Filtres</span>
            {activeCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <RotateCcw className="h-3 w-3" />
              Reinit.
            </Button>
          )}
        </div>
      )}
      {/* Compact reset button */}
      {compact && hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser ({activeCount})
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Nom, competence..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white/5 border-white/10 pl-8 text-sm placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Role type — pill grid */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Type de role</p>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(ROLE_TYPE_LABELS).map(([value, label]) => {
            const isActive = roleType === value;
            return (
              <button
                key={value}
                onClick={() => setRoleType(isActive ? "" : value)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-center transition-all",
                  "flex flex-col items-center gap-0.5",
                  isActive
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:bg-white/8 hover:text-foreground"
                )}
              >
                <span className="text-[10px] font-bold">{ROLE_ICONS[value]}</span>
                <span className="text-[10px] leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Experience level */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Niveau</p>
        <div className="flex gap-1.5">
          {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => {
            const isActive = experienceLevel === value;
            return (
              <button
                key={value}
                onClick={() => setExperienceLevel(isActive ? "" : value)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all",
                  isActive
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:bg-white/8 hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* City */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ville</p>
        <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
          <button
            onClick={() => setCity("all")}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] transition-all",
              !city || city === "all"
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
            )}
          >
            Toutes
          </button>
          {CONGO_CITIES.map((c) => {
            const isActive = city === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setCity(isActive ? "all" : c.name)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] transition-all",
                  isActive
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tech chips */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Technologies</p>
        <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
          {TECH_OPTIONS.slice(0, 20).map((tech) => {
            const isSelected = techStack.includes(tech);
            return (
              <Badge
                key={tech}
                variant="outline"
                className={cn(
                  "cursor-pointer border text-[11px] transition-all",
                  isSelected
                    ? "border-primary/60 bg-primary/15 text-primary hover:bg-primary/20"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
                onClick={() => {
                  if (isSelected) {
                    setTechStack(techStack.filter((t) => t !== tech));
                  } else {
                    setTechStack([...techStack, tech]);
                  }
                }}
              >
                {tech}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Collaboration toggle */}
      <button
        onClick={() => setOpenToCollaboration(openToCollaboration === true ? null : true)}
        className={cn(
          "w-full rounded-lg border px-3 py-2.5 text-left transition-all",
          "flex items-center gap-2.5",
          openToCollaboration === true
            ? "border-primary/60 bg-primary/10"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
        )}
      >
        <div className={cn(
          "h-4 w-4 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors",
          openToCollaboration === true ? "border-primary bg-primary" : "border-muted-foreground"
        )}>
          {openToCollaboration === true && (
            <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className={cn(
          "text-xs font-medium",
          openToCollaboration === true ? "text-primary" : "text-muted-foreground"
        )}>
          Ouvert a la collaboration
        </span>
      </button>
    </div>
  );
}
