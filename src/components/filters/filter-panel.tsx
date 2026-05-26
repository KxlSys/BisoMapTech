import { useState } from "react";
import { Search, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useFilterStore } from "@/store/filter-store";
import { useLocations } from "@/hooks/use-locations";

import {
  ROLE_TYPE_LABELS,
  EXPERIENCE_LABELS,
} from "@/lib/constants";

import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<string, string> = {
  frontend: "FE",
  backend: "BE",
  fullstack: "FS",
  data: "DA",
  devops: "DO",
  mobile: "MB",
  sysadmin: "SA",
  cybersecurite: "CY",
  support: "SP",
  design: "DS",
  hardware: "HW",
  product: "PM",
  enseignement: "ED",
  nocode: "NC",
  vibecoder: "VC",
  autre: "AU",
};

export function FilterPanel({
  compact = false,
  hideSearch = false,
}: {
  compact?: boolean;
  hideSearch?: boolean;
}) {
  const {
    searchQuery,
    city,
    département,
    techStack,
    roleType,
    experienceLevel,
    openToCollaboration,

    setSearchQuery,
    setCity,
    setDépartement,
    setRoleType,
    setExperienceLevel,

    resetFilters,
  } = useFilterStore();

  const { cities, departments } = useLocations();

  const [isRoleOpen, setIsRoleOpen] = useState(true);
  const [isLevelOpen, setIsLevelOpen] = useState(!!experienceLevel);
  const [isLocationOpen, setIsLocationOpen] = useState(
    (!!city && city !== "all") || (!!département && département !== "all")
  );

  const hasActiveFilters =
    searchQuery ||
    city ||
    département ||
    techStack.length > 0 ||
    roleType ||
    experienceLevel ||
    openToCollaboration !== null;

  const activeCount = [
    searchQuery,
    city && city !== "all" ? city : null,
    département && département !== "all" ? département : null,
    techStack.length > 0 ? techStack : null,
    roleType && roleType !== "all" ? roleType : null,
    experienceLevel && experienceLevel !== "all" ? experienceLevel : null,
    openToCollaboration !== null ? openToCollaboration : null,
  ].filter(Boolean).length;

  const handleReset = () => {
    resetFilters();
    setIsLevelOpen(false);
    setIsLocationOpen(false);
  };

  return (
    <div
      className={cn(
        "space-y-3.5",
        !compact && "glass-panel rounded-xl border border-white/10 p-4"
      )}
    >
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
              Filtres
            </span>
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
              onClick={handleReset}
              className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <RotateCcw className="h-3 w-3" />
              Réinit.
            </Button>
          )}
        </div>
      )}

      {compact && hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser ({activeCount})
          </Button>
        </div>
      )}

      {!hideSearch && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher nom, compétence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border-white/10 pl-8 h-9 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
          />
        </div>
      )}

      <div className="border border-white/8 rounded-xl bg-white/5 overflow-hidden transition-all duration-200">
        <button
          onClick={() => setIsRoleOpen(!isRoleOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Type de rôle
            </span>
            {roleType && (
              <span className="rounded bg-primary/20 border border-primary/30 text-primary px-1.5 py-0.5 text-[9px] font-bold uppercase">
                {ROLE_ICONS[roleType] || roleType}
              </span>
            )}
          </div>
          {isRoleOpen ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground/60" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
          )}
        </button>

        {isRoleOpen && (
          <div className="px-2.5 pb-2.5 pt-1 border-t border-white/5 bg-white/[0.02]">
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(ROLE_TYPE_LABELS).map(([value, label]) => {
                const isActive = roleType === value;
                return (
                  <button
                    key={value}
                    onClick={() => setRoleType(isActive ? "" : value)}
                    className={cn(
                      "rounded-lg border px-1 py-1.5 text-center transition-all",
                      "flex flex-col items-center gap-0.5",
                      isActive
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-white/5 bg-white/5 text-muted-foreground hover:border-white/15 hover:bg-white/8 hover:text-foreground"
                    )}
                  >
                    <span className="text-[10px] font-bold">
                      {ROLE_ICONS[value]}
                    </span>
                    <span className="text-[10px] leading-tight truncate w-full px-0.5">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="border border-white/8 rounded-xl bg-white/5 overflow-hidden transition-all duration-200">
        <button
          onClick={() => setIsLevelOpen(!isLevelOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Niveau d'expérience
            </span>
            {experienceLevel && (
              <span className="rounded bg-primary/20 border border-primary/30 text-primary px-1.5 py-0.5 text-[9px] font-bold uppercase">
                {experienceLevel === "junior"
                  ? "Junior"
                  : experienceLevel === "intermediate"
                  ? "Inter."
                  : "Senior"}
              </span>
            )}
          </div>
          {isLevelOpen ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground/60" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
          )}
        </button>

        {isLevelOpen && (
          <div className="px-2.5 pb-2.5 pt-1.5 border-t border-white/5 bg-white/[0.02]">
            <div className="flex gap-1">
              {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => {
                const isActive = experienceLevel === value;
                return (
                  <button
                    key={value}
                    onClick={() => setExperienceLevel(isActive ? "" : value)}
                    className={cn(
                      "flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-all text-center",
                      isActive
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-white/5 bg-white/5 text-muted-foreground hover:border-white/15 hover:bg-white/8 hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="border border-white/8 rounded-xl bg-white/5 overflow-hidden transition-all duration-200">
        <button
          onClick={() => setIsLocationOpen(!isLocationOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Localisation
            </span>
            {((city && city !== "all") || (département && département !== "all")) && (
              <span className="rounded bg-primary/20 border border-primary/30 text-primary px-1.5 py-0.5 text-[9px] font-bold uppercase truncate max-w-[80px]">
                {city && city !== "all" ? city : département}
              </span>
            )}
          </div>
          {isLocationOpen ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground/60" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
          )}
        </button>

        {isLocationOpen && (
          <div className="px-2.5 pb-2.5 pt-2 border-t border-white/5 bg-white/[0.02] space-y-2.5">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Département
              </p>
              <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto pr-1 scrollbar-thin">
                <button
                  onClick={() => setDépartement("all")}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] transition-all",
                    !département || département === "all"
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-white/5 bg-white/5 text-muted-foreground hover:border-white/15 hover:text-foreground"
                  )}
                >
                  Tous
                </button>
                {departments.map((dep) => {
                  const isActive = département === dep;
                  return (
                    <button
                      key={dep}
                      onClick={() => setDépartement(isActive ? "all" : dep)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[9px] transition-all",
                        isActive
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-white/5 bg-white/5 text-muted-foreground hover:border-white/15 hover:text-foreground"
                      )}
                    >
                      {dep}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Ville
              </p>
              <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto pr-1 scrollbar-thin">
                <button
                  onClick={() => setCity("all")}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] transition-all",
                    !city || city === "all"
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-white/5 bg-white/5 text-muted-foreground hover:border-white/15 hover:text-foreground"
                  )}
                >
                  Toutes
                </button>
                {cities.map((c) => {
                  const isActive = city === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setCity(isActive ? "all" : c.name)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[9px] transition-all",
                        isActive
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-white/5 bg-white/5 text-muted-foreground hover:border-white/15 hover:text-foreground"
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
