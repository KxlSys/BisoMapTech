import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type L from "leaflet";
import { MapPin, Plus, Loader2, Locate, List, Map } from "lucide-react";
import { PlacesMap } from "@/components/map/places-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function PlacesPage() {
  const { user } = useAuthStore();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | undefined>(undefined);
  const leafletMapRef = useRef<L.Map | null>(null);

  const handleMapReady = useCallback((map: L.Map) => {
    leafletMapRef.current = map;
  }, []);

  const cities = useMemo(() => ["all", ...CONGO_CITIES.map((c) => c.name)], []);
  const categories = useMemo(() => ["all", ...PLACE_CATEGORIES], []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const t = window.setTimeout(async () => {
      try {
        const { places } = await fetchPaginatedPlaces({
          page: 1,
          pageSize: 200,
          search,
          city,
          category,
        });
        if (!cancelled) setPlaces(places);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [search, city, category]);

  const lastPlacesLengthRef = useRef(places.length);

  // Auto-focus a single place search result
  useEffect(() => {
    if (places.length === 1 && lastPlacesLengthRef.current !== 1) {
      setFocusedPlaceId(places[0].id);
    } else if (places.length === 0 || places.length > 1) {
      setFocusedPlaceId(undefined);
    }
    lastPlacesLengthRef.current = places.length;
  }, [places]);

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ─────────────────── LEFT SIDEBAR ─────────────────── */}
      <aside
        className={cn(
          "w-full md:w-[380px] md:shrink-0 flex-col border-r border-white/8 overflow-hidden transition-all duration-300",
          mobileView === "list" ? "flex" : "hidden md:flex"
        )}
        style={{ background: "oklch(0.13 0.022 235 / 85%)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
      >
        <div className="flex-shrink-0 border-b border-white/8 px-6 py-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-tertiary">Lieux</h2>
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-tertiary/70" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Rechercher des endroits utiles</p>
        </div>

        <div className="flex-shrink-0 border-b border-white/8 px-4 py-4 space-y-3">
          <Input
            placeholder="Rechercher (nom, ville, adresse...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border-white/10"
          />

          <div className="grid grid-cols-2 gap-2">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "Toutes" : c}
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
                    {c === "all" ? "Toutes" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-3">
            <h3 className="text-sm font-semibold text-foreground">Résultats</h3>
            {user && (
              <Link to="/lieux/nouveau" className="text-xs font-medium text-tertiary hover:underline underline-offset-2">
                Proposer
              </Link>
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-2 p-4">
              {places.slice(0, 30).map((p) => (
                <a
                  key={p.id}
                  href={`/lieux/${p.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setFocusedPlaceId(p.id);
                    setMobileView("map");
                  }}
                  className="block rounded-xl border border-white/8 bg-white/5 px-4 py-3 hover:bg-white/8 transition-colors text-left"
                >
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {p.category} · {p.city || "—"}
                  </p>
                </a>
              ))}
              {places.length === 0 && !isLoading && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Aucun résultat</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Modifiez la recherche</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* ─────────────────── MAP AREA ─────────────────── */}
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
              {places.length} lieu{places.length !== 1 ? "x" : ""} affiché{places.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="absolute right-4 top-4 z-[1000] hidden flex-col gap-2 lg:flex">
          <button
            onClick={() => leafletMapRef.current?.setView([-2.8, 15.2], 6)}
            className="glass-panel flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-foreground shadow-lg transition-all hover:border-tertiary/60 hover:text-tertiary hover:scale-105 active:scale-95"
            aria-label="Recentrer"
          >
            <Locate className="h-4 w-4" />
          </button>
        </div>

        {user ? (
          <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto md:hidden">
            <Link to="/lieux/nouveau">
              <Button size="sm" className="gap-2 bg-tertiary text-background hover:bg-tertiary/90 font-semibold">
                <Plus className="h-3.5 w-3.5" />
                Proposer un lieu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto md:hidden">
            <Link to="/login">
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                <MapPin className="h-3.5 w-3.5" />
                Se connecter
              </Button>
            </Link>
          </div>
        )}

        <div className="h-full w-full">
          <PlacesMap
            places={places}
            onMapReady={handleMapReady}
            focusedPlaceId={focusedPlaceId}
          />
        </div>

        {/* Mobile Map/List Toggle FAB */}
        <div className="fixed bottom-6 left-1/2 z-[1000] -translate-x-1/2 md:hidden">
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
