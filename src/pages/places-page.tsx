import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type L from "leaflet";
import { MapPin, Plus, Loader2, Locate, List, Map, AlertCircle, RotateCcw, LogIn } from "lucide-react";
import { PlacesMap } from "@/components/map/places-map";
import { Button } from "@/components/ui/button";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { fetchPaginatedPlaces } from "@/lib/place-service";
import { PLACE_CATEGORIES } from "@/lib/constants";
import { CONGO_CITIES } from "@/lib/cities";
import type { Place } from "@/types";
import { cn } from "@/lib/utils";

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  "Espace Tech": "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  "Coworking": "bg-violet-500/15 text-violet-400 border-violet-500/25",
  "Incubateur / Accélérateur": "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "Formation / Bootcamp": "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  "Fab Lab": "bg-sky-500/15 text-sky-400 border-sky-500/25",
  "Café": "bg-amber-500/15 text-amber-400 border-amber-500/25",
  "Restaurant": "bg-orange-500/15 text-orange-400 border-orange-500/25",
  "Marché": "bg-lime-500/15 text-lime-400 border-lime-500/25",
  "Pharmacie": "bg-green-500/15 text-green-400 border-green-500/25",
  "Hôpital": "bg-red-500/15 text-red-400 border-red-500/25",
  "École / Université": "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "Opérateur Télécoms": "bg-pink-500/15 text-pink-400 border-pink-500/25",
  "Cybercafé / Point Internet": "bg-teal-500/15 text-teal-400 border-teal-500/25",
  "ONG Tech": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  "Autre": "bg-white/10 text-muted-foreground border-white/15",
};

function getCategoryBadge(category: string): string {
  return CATEGORY_BADGE_COLORS[category] ?? "bg-white/10 text-muted-foreground border-white/15";
}

function PlaceCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 animate-pulse">
      <div className="h-3.5 w-2/3 rounded bg-white/10 mb-2" />
      <div className="h-3 w-1/3 rounded bg-white/8" />
    </div>
  );
}

const MemoizedPlaceListItem = React.memo(({
  place,
  onClick
}: {
  place: Place;
  onClick: (id: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onClick(place.id)}
    className="w-full rounded-xl border border-white/8 bg-white/5 px-4 py-3 hover:bg-white/8 transition-colors text-left"
  >
    <p className="text-sm font-semibold text-foreground">{place.name}</p>
    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
      <Badge
        variant="outline"
        className={cn("text-[10px] py-0 px-1.5 font-medium border", getCategoryBadge(place.category))}
      >
        {place.category}
      </Badge>
      {place.city && (
        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
          <MapPin className="h-2.5 w-2.5" />
          {place.city}
        </span>
      )}
    </div>
  </button>
));

export function PlacesPage() {
  const { user } = useAuthStore();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | undefined>(undefined);
  const [retryTick, setRetryTick] = useState(0);
  const leafletMapRef = useRef<L.Map | null>(null);

  const hasActiveFilters = search !== "" || city !== "all" || category !== "all";

  const handleMapReady = useCallback((map: L.Map) => {
    leafletMapRef.current = map;
  }, []);

  function resetFilters() {
    setSearch("");
    setCity("all");
    setCategory("all");
  }

  const cities = useMemo(() => ["all", ...CONGO_CITIES.map((c) => c.name)], []);
  const categories = useMemo(() => ["all", ...PLACE_CATEGORIES], []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setFetchError(null);

    // ⚡ Bolt: Remove redundant 250ms setTimeout wrapper around fetchPaginatedPlaces.
    // The `search` state is controlled by DebouncedInput which already handles debouncing.
    // Executing the fetch immediately removes artificial delay for fast inputs (dropdowns)
    // and eliminates the double-debounce latency for text search.
    async function fetchPlaces() {
      try {
        const { places } = await fetchPaginatedPlaces({
          page: 1,
          pageSize: 200,
          search,
          city,
          category,
        });
        if (!cancelled) setPlaces(places);
      } catch {
        if (!cancelled) setFetchError("Impossible de charger les lieux. Vérifiez votre connexion.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPlaces();

    return () => {
      cancelled = true;
    };
  }, [search, city, category, retryTick]);

  const lastPlacesLengthRef = useRef(places.length);

  useEffect(() => {
    if (places.length === 1 && lastPlacesLengthRef.current !== 1) {
      setFocusedPlaceId(places[0].id);
    } else if (places.length === 0 || places.length > 1) {
      setFocusedPlaceId(undefined);
    }
    lastPlacesLengthRef.current = places.length;
  }, [places]);

  const LIST_LIMIT = 50;
  // ⚡ Bolt: Memoize the sliced array to prevent returning a new reference on every render,
  // avoiding unnecessary re-renders of child components when unrelated state changes.
  const displayedPlaces = useMemo(() => places.slice(0, LIST_LIMIT), [places]);

  const handlePlaceClick = useCallback((id: string) => {
    setFocusedPlaceId(id);
    setMobileView("map");
  }, []);

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* ─────────────────── LEFT SIDEBAR ─────────────────── */}
      <aside
        className={cn(
          "w-full md:w-[380px] md:shrink-0 flex-col border-r border-white/8 overflow-hidden transition-all duration-300",
          mobileView === "list" ? "flex" : "hidden md:flex"
        )}
        style={{ background: "oklch(0.13 0.022 235 / 85%)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
      >
        <div className="flex-shrink-0 border-b border-white/8 px-6 py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-tertiary">Lieux</h2>
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-tertiary/70" />}
            </div>
            {user ? (
              <Link to="/lieux/nouveau">
                <Button size="sm" variant="ghost" className="h-8 gap-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-tertiary">
                  <Plus className="h-3 w-3" />
                  Proposer
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm" variant="ghost" className="h-8 gap-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-muted-foreground">
                  <LogIn className="h-3 w-3" />
                  Se connecter
                </Button>
              </Link>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Espaces tech, coworkings, incubateurs…</p>
        </div>

        <div className="flex-shrink-0 border-b border-white/8 px-4 py-4 space-y-3">
          <DebouncedInput
            placeholder="Rechercher (nom, ville, adresse...)"
            value={search}
            onChange={setSearch}
            aria-label="Rechercher des lieux par nom, ville ou adresse"
            className="bg-white/5 border-white/10"
          />

          <div className="hidden md:grid grid-cols-2 gap-2">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "Toutes les villes" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "Toutes catégories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile minimal filter info (could be expanded to a full sheet later) */}
          <div className="md:hidden flex flex-wrap gap-2">
             <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs w-[120px]">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c === "all" ? "Toutes les villes" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-white/5 border-white/10 h-8 text-xs flex-1">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c === "all" ? "Toutes cat." : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              {isLoading ? "Chargement…" : `${places.length} lieu${places.length !== 1 ? "x" : ""}`}
            </h3>
            {places.length > LIST_LIMIT && (
              <span className="text-[10px] text-muted-foreground/60">
                {LIST_LIMIT} affichés
              </span>
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-2 p-4">
              {isLoading && places.length === 0 && (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <PlaceCardSkeleton key={i} />
                  ))}
                </>
              )}

              {!isLoading && fetchError && (
                <div className="py-8 text-center space-y-2">
                  <AlertCircle className="mx-auto h-6 w-6 text-destructive/70" />
                  <p className="text-sm text-muted-foreground">{fetchError}</p>
                  <button
                    onClick={() => {
                      resetFilters();
                      setRetryTick((v) => v + 1);
                    }}
                    className="text-xs text-tertiary hover:underline"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {!isLoading && !fetchError && displayedPlaces.map((p) => (
                <MemoizedPlaceListItem
                  key={p.id}
                  place={p}
                  onClick={handlePlaceClick}
                />
              ))}

              {places.length > LIST_LIMIT && !isLoading && (
                <p className="py-2 text-center text-[11px] text-muted-foreground/60">
                  + {places.length - LIST_LIMIT} autres résultats — affinez la recherche
                </p>
              )}

              {!isLoading && !fetchError && places.length === 0 && (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <MapPin className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aucun résultat</p>
                    <p className="mt-0.5 text-xs text-muted-foreground/60">
                      {hasActiveFilters ? "Modifiez ou réinitialisez les filtres" : "Aucun lieu enregistré pour l'instant"}
                    </p>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-xs font-medium text-tertiary hover:underline"
                    >
                      Réinitialiser
                    </button>
                  )}
                  {user && (
                    <Link to="/lieux/nouveau" className="block">
                      <Button size="sm" variant="ghost" className="gap-1.5 border border-white/10 bg-white/5 text-xs text-tertiary">
                        <Plus className="h-3 w-3" />
                        Proposer ce lieu
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>

      <section
        className={cn(
          "relative flex-1 overflow-hidden transition-all duration-300",
          mobileView === "map" ? "flex flex-col" : "hidden md:flex md:flex-col"
        )}
      >
        <div className="absolute left-4 top-4 z-[1000] pointer-events-auto">
          <div className="glass-panel rounded-2xl border border-white/15 px-5 py-4 shadow-2xl hover:border-white/20 transition-colors">
            <h1 className="text-xl font-bold text-foreground leading-tight md:text-2xl">
              Carte des lieux
            </h1>
            <p className="mt-1 text-sm font-semibold text-tertiary">
              {places.length} lieu{places.length !== 1 ? "x" : ""} sur la carte
            </p>
          </div>
        </div>

        <div className="absolute right-4 top-4 z-[1000] hidden flex-col gap-2 md:flex">
          <button
            onClick={() => leafletMapRef.current?.setView([-2.8, 15.2], 6)}
            className="glass-panel flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-foreground shadow-lg transition-all hover:border-tertiary/60 hover:text-tertiary hover:scale-105 active:scale-95"
            aria-label="Recentrer la carte"
          >
            <Locate className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute bottom-20 left-4 z-[1000] pointer-events-auto md:hidden">
          {user ? (
            <Link to="/lieux/nouveau">
              <Button size="sm" className="gap-2 bg-tertiary text-background hover:bg-tertiary/90 font-semibold shadow-lg">
                <Plus className="h-3.5 w-3.5" />
                Proposer
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg">
                <LogIn className="h-3.5 w-3.5" />
                Se connecter
              </Button>
            </Link>
          )}
        </div>

        <div className="h-full w-full">
          <PlacesMap
            places={places}
            onMapReady={handleMapReady}
            focusedPlaceId={focusedPlaceId}
          />
        </div>

        {/* Mobile Map/List Toggle FAB */}
        <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2 md:hidden">
          <Button
            onClick={() => setMobileView(mobileView === "map" ? "list" : "map")}
            className="glass-panel flex h-11 items-center gap-2 rounded-full border border-white/20 bg-black/75 px-5 text-xs font-bold text-foreground shadow-2xl backdrop-blur-xl hover:border-tertiary/40 hover:text-tertiary active:scale-95 transition-all"
          >
            {mobileView === "map" ? (
              <>
                <List className="h-4 w-4 text-tertiary" />
                Voir la liste
              </>
            ) : (
              <>
                <Map className="h-4 w-4 text-tertiary" />
                Voir la carte
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
