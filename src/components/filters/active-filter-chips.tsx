import { X, RotateCcw } from "lucide-react";
import { useFilterStore } from "@/store/filter-store";
import { ROLE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ActiveFilter {
  id: string;
  label: string;
  clear: () => void;
}

/**
 * Filtres actifs, chacun retirable d'un clic.
 *
 * Sans cette ligne, il faut rouvrir les sections du panneau pour comprendre
 * pourquoi la liste ne renvoie que trois résultats.
 */
export function ActiveFilterChips({ className }: { className?: string }) {
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
    setTechStack,
    setRoleType,
    setExperienceLevel,
    setOpenToCollaboration,
    resetFilters,
  } = useFilterStore();

  const filters: ActiveFilter[] = [];

  if (searchQuery.trim()) {
    filters.push({
      id: "search",
      label: `« ${searchQuery.trim()} »`,
      clear: () => setSearchQuery(""),
    });
  }

  if (roleType && roleType !== "all") {
    filters.push({
      id: "role",
      label: ROLE_TYPE_LABELS[roleType] || roleType,
      clear: () => setRoleType(""),
    });
  }

  if (experienceLevel && experienceLevel !== "all") {
    filters.push({
      id: "level",
      label: EXPERIENCE_LABELS[experienceLevel] || experienceLevel,
      clear: () => setExperienceLevel(""),
    });
  }

  if (city && city !== "all") {
    filters.push({ id: "city", label: city, clear: () => setCity("all") });
  }

  if (département && département !== "all") {
    filters.push({
      id: "departement",
      label: département,
      clear: () => setDépartement("all"),
    });
  }

  for (const tech of techStack) {
    filters.push({
      id: `tech-${tech}`,
      label: tech,
      clear: () => setTechStack(techStack.filter((t) => t !== tech)),
    });
  }

  if (openToCollaboration !== null) {
    filters.push({
      id: "collab",
      label: openToCollaboration ? "Disponibles" : "Non disponibles",
      clear: () => setOpenToCollaboration(null),
    });
  }

  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={filter.clear}
          aria-label={`Retirer le filtre ${filter.label}`}
          className="group flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 py-1 pl-3 pr-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {filter.label}
          <X className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
        </button>
      ))}

      {filters.length > 1 && (
        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RotateCcw className="h-3 w-3" />
          Tout retirer
        </button>
      )}
    </div>
  );
}
