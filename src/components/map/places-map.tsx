import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "@/types";
import { useTheme } from "@/components/theme-provider";
import { escapeHtml } from "@/lib/profile-service";

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const CONGO_CENTER: L.LatLngExpression = [-2.8, 15.2];
const CONGO_ZOOM = 6;

const CONGO_BOUNDS: L.LatLngBoundsExpression = [
  [-5.1, 11.0],
  [3.8, 18.7],
];

function createMarkerIcon() {
  return L.divIcon({
    html: `<div style="background:var(--tertiary);width:12px;height:12px;border-radius:4px;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
    className: "custom-marker",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

interface PlacesMapProps {
  places: Place[];
  onMapReady?: (map: L.Map) => void;
}

export function PlacesMap({ places, onMapReady }: PlacesMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: CONGO_CENTER,
      zoom: CONGO_ZOOM,
      zoomControl: false,
      attributionControl: true,
      maxBounds: CONGO_BOUNDS,
      maxBoundsViscosity: 0.8,
      minZoom: 5,
      maxZoom: 13,
    });

    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    tileLayerRef.current = L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 13,
    }).addTo(mapRef.current);

    markersRef.current = L.layerGroup().addTo(mapRef.current);

    onMapReady?.(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!tileLayerRef.current || !mapRef.current) return;

    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    tileLayerRef.current.setUrl(isDark ? DARK_TILES : LIGHT_TILES);
  }, [theme]);

  useEffect(() => {
    if (!markersRef.current || !mapRef.current) return;

    markersRef.current.clearLayers();

    places.forEach((place) => {
      if (!place.latitude || !place.longitude) return;

      const marker = L.marker([place.latitude, place.longitude], {
        icon: createMarkerIcon(),
      });

      const safeName = escapeHtml(place.name);
      const safeCity = escapeHtml(place.city || "");
      const safeCategory = escapeHtml(place.category);

      const popupContent = `
        <div style="min-width:180px;font-family:system-ui,sans-serif">
          <div style="font-weight:700;font-size:14px;margin-bottom:2px">${safeName}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px">${safeCity}</div>
          <div style="display:inline-flex;align-items:center;gap:6px;background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;margin-bottom:8px">
            ${safeCategory}
          </div>
          <a href="/lieux/${escapeHtml(place.id)}"
             style="display:block;font-size:12px;color:#1d4ed8;text-decoration:none;font-weight:600">
            Voir la fiche &rarr;
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: true, maxWidth: 260 });
      markersRef.current!.addLayer(marker);
    });
  }, [places]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg border border-border"
      style={{ minHeight: "400px" }}
      role="application"
      aria-label="Carte interactive des lieux au Congo-Brazzaville"
    />
  );
}
