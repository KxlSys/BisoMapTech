import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { ListFilter as Filter, X, ChevronRight, Plus, Minus, Locate, MapPin, Loader2, List, Map } from "lucide-react";
import type L from "leaflet";
import { CongoMap } from "@/components/map/congo-map";
import { FilterPanel } from "@/components/filters/filter-panel";
import { ProfileCard } from "@/components/profile/profile-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFilteredProfiles } from "@/hooks/use-filtered-profiles";
import { useAuthStore } from "@/store/auth-store";
import { useFilterStore } from "@/store/filter-store";
import { cn } from "@/lib/utils";

export function MapPage() {
  const { profiles, isLoading } = useFilteredProfiles({ pageSize: 200 });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [focusedProfileId, setFocusedProfileId] = useState<string | undefined>(undefined);
  const { user } = useAuthStore();
  const { resetFilters } = useFilterStore();
  const leafletMapRef = useRef<L.Map | null>(null);

  const listProfiles = user ? profiles.filter((p) => p.id !== user.id) : profiles;

  const handleMapReady = useCallback((map: L.Map) => {
    leafletMapRef.current = map;
  }, []);

  const lastProfilesLengthRef = useRef(profiles.length);

  // Auto-focus a single search result
  useEffect(() => {
    if (profiles.length === 1 && lastProfilesLengthRef.current !== 1) {
      setFocusedProfileId(profiles[0].id);
    } else if (profiles.length === 0 || profiles.length > 1) {
      setFocusedProfileId(undefined);
    }
    lastProfilesLengthRef.current = profiles.length;
  }, [profiles]);

  return (
    /* Full viewport minus navbar height — mobile subtracts top (3rem) + bottom nav (4rem) */
    <div className="relative flex h-[calc(100vh-7rem)] overflow-hidden md:h-[calc(100vh-3.5rem)]">

      {/* ─────────────────── LEFT SIDEBAR ─────────────────── */}
      <aside
        className={cn(
          "w-full md:w-[380px] md:shrink-0 flex-col border-r border-white/8 overflow-hidden transition-all duration-300",
          mobileView === "list" ? "flex" : "hidden md:flex"
        )}
        style={{ background: "oklch(0.13 0.022 235 / 85%)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
      >
        {/* Sidebar header */}
        <div className="flex-shrink-0 border-b border-white/8 px-6 py-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-primary">Filtres</h2>
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/50" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Affiner la recherche de talents</p>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 border-b border-white/8 px-4 py-4">
          <FilterPanel compact />
        </div>

        {/* Talents list */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-3">
            <h3 className="text-sm font-semibold text-foreground">Talents récents</h3>
            <Link to="/contributeurs" className="text-xs font-medium text-primary hover:underline underline-offset-2">
              Voir tout
            </Link>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-2 p-4 pb-8">
              {listProfiles.slice(0, 20).map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onClick={(e) => {
                    e.preventDefault();
                    setFocusedProfileId(profile.id);
                    setMobileView("map");
                  }}
                />
              ))}
              {listProfiles.length > 20 && (
                <Link to="/contributeurs">
                  <p className="py-2 text-center text-xs text-muted-foreground hover:text-primary transition-colors">
                    +{listProfiles.length - 20} autres contributeurs →
                  </p>
                </Link>
              )}
              {listProfiles.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Aucun résultat</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Modifiez vos filtres</p>
                  <div className="mt-3 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-white/15 bg-white/5 hover:bg-white/8"
                      onClick={() => resetFilters()}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Apply filters CTA */}
        <div className="flex-shrink-0 border-t border-white/8 p-4 md:hidden">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_4px_16px_oklch(0.82_0.16_155/25%)] active:scale-95"
            size="default"
            onClick={() => setMobileView("map")}
          >
            Revenir à la carte
          </Button>
        </div>
      </aside>

      {/* ─────────────────── MAP AREA ─────────────────── */}
      <section
        className={cn(
          "relative flex-1 overflow-hidden transition-all duration-300",
          mobileView === "map" ? "flex flex-col" : "hidden md:flex md:flex-col"
        )}
      >
        {/* Floating map header — z-index > Leaflet's 400 */}
        <div className="absolute left-4 top-4 z-[1000] pointer-events-auto">
          <div className="glass-panel rounded-2xl border border-white/15 px-5 py-4 shadow-2xl hover:border-white/20 transition-colors">
            <h1 className="text-xl font-bold text-foreground leading-tight md:text-2xl">
              Carte de la communauté tech
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <p className="text-sm font-semibold text-primary">
                {profiles.length} contributeur{profiles.length !== 1 ? "s" : ""} au Congo
              </p>
            </div>
          </div>
        </div>

        {/* Map zoom/locate controls (top-right) */}
        <div className="absolute right-4 top-4 z-[1000] hidden flex-col gap-2 lg:flex">
          <button
            onClick={() => leafletMapRef.current?.zoomIn()}
            className="glass-panel flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-foreground shadow-lg transition-all hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95"
            aria-label="Zoom avant"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => leafletMapRef.current?.zoomOut()}
            className="glass-panel flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-foreground shadow-lg transition-all hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95"
            aria-label="Zoom arrière"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => leafletMapRef.current?.setView([-2.8, 15.2], 6)}
            className="glass-panel flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-foreground shadow-lg transition-all hover:border-primary/40 hover:text-primary hover:scale-105 active:scale-95"
            aria-label="Recentrer"
          >
            <Locate className="h-4 w-4" />
          </button>
        </div>

        {/* Map legend (bottom-right) */}
        <div className="absolute bottom-4 right-4 z-[1000] pointer-events-auto">
          <div className="glass-panel flex items-center gap-5 rounded-xl border border-white/12 px-5 py-3 text-xs hover:border-white/20 transition-colors">
            <LegendDot color="bg-primary" label="Développeurs" />
            <LegendDot color="bg-tertiary" label="Infrastructure" />
            <LegendDot color="bg-map-accent" label="Espaces Tech" />
          </div>
        </div>

        {/* Join CTA (bottom-left) — only shown when not logged in */}
        {!user && (
          <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto">
            <Link to="/login">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-semibold shadow-[0_4px_16px_oklch(0.82_0.16_155/30%)]"
              >
                <MapPin className="h-3.5 w-3.5" />
                Rejoindre la communauté
              </Button>
            </Link>
          </div>
        )}

        {/* Mobile filter FAB */}
        <div className="absolute bottom-20 right-4 z-[1000] md:hidden">
          <Button
            size="sm"
            onClick={() => setMobileFiltersOpen(true)}
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 p-0"
            aria-label="Ouvrir les filtres"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Map component — full fill */}
        <div className="h-full w-full">
          <CongoMap
            profiles={profiles}
            onMapReady={handleMapReady}
            focusedProfileId={focusedProfileId}
          />
        </div>

        {/* Mobile Map/List Toggle FAB */}
        <div className="fixed bottom-20 left-1/2 z-[1000] -translate-x-1/2 md:hidden">
          <Button
            onClick={() => setMobileView(mobileView === "map" ? "list" : "map")}
            className="glass-panel flex h-11 items-center gap-2 rounded-full border border-white/20 bg-black/75 px-5 text-xs font-bold text-foreground shadow-2xl backdrop-blur-xl hover:border-primary/40 hover:text-primary active:scale-95 transition-all"
          >
            {mobileView === "map" ? (
              <>
                <List className="h-4 w-4 text-primary" />
                Voir la liste
              </>
            ) : (
              <>
                <Map className="h-4 w-4 text-primary" />
                Voir la carte
              </>
            )}
          </Button>
        </div>
      </section>

      {/* ─────────────────── MOBILE FILTER SHEET ─────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[600] flex flex-col md:hidden">
          {/* Backdrop */}
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          {/* Bottom sheet */}
          <div className="rounded-t-2xl border-t border-white/15 max-h-[88vh] flex flex-col"
            style={{ background: "oklch(0.12 0.025 235 / 98%)" }}>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <p className="font-semibold text-sm">Filtres</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileFiltersOpen(false)}
                className="h-7 w-7 p-0 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Filter content */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <FilterPanel />
            </div>
            {/* Sticky bottom CTA */}
            <div className="shrink-0 border-t border-white/10 p-4"
              style={{ background: "oklch(0.12 0.025 235 / 98%)" }}>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-bold"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Voir {profiles.length} résultat{profiles.length !== 1 ? "s" : ""}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
