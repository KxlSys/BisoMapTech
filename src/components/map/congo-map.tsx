import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Profile } from "@/types";
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

function createMarkerIcon(isCollaborating: boolean) {
  return L.divIcon({
    html: `<div style="background:${isCollaborating ? "#16a34a" : "#6b7280"};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
    className: "custom-marker",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

interface CongoMapProps {
  profiles: Profile[];
  onProfileClick?: (profile: Profile) => void;
  onMapReady?: (map: L.Map) => void;
}

export function CongoMap({ profiles, onProfileClick, onMapReady }: CongoMapProps) {
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

    profiles.forEach((profile) => {
      if (!profile.latitude || !profile.longitude) return;

      const marker = L.marker([profile.latitude, profile.longitude], {
        icon: createMarkerIcon(profile.open_to_collaboration),
      });

      const safeName = escapeHtml(profile.full_name);
      const safeCity = escapeHtml(profile.city);
      const safeTechs = profile.tech_stack
        .slice(0, 3)
        .map((t) => `<span style="background:#f0fdf4;color:#166534;padding:2px 6px;border-radius:4px;font-size:11px">${escapeHtml(t)}</span>`)
        .join("");
      const safeUsername = encodeURIComponent(profile.username);
      const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=16a34a&color=fff`;

      const popupContent = `
        <div style="min-width:180px;font-family:system-ui,sans-serif">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <img src="${escapeHtml(avatarUrl)}"
                 alt=""
                 style="width:32px;height:32px;border-radius:50%;object-fit:cover"
                 onerror="this.style.display='none'" />
            <div>
              <div style="font-weight:600;font-size:14px">${safeName}</div>
              <div style="font-size:12px;color:#6b7280">${safeCity}</div>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">
            ${safeTechs}
          </div>
          <a href="/contributeurs/${safeUsername}"
             style="font-size:12px;color:#16a34a;text-decoration:none;font-weight:500">
            Voir le profil &rarr;
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: true, maxWidth: 250 });

      marker.on("click", () => {
        onProfileClick?.(profile);
      });

      markersRef.current!.addLayer(marker);
    });
  }, [profiles, onProfileClick]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg border border-border"
      style={{ minHeight: "400px" }}
      role="application"
      aria-label="Carte interactive des contributeurs tech au Congo-Brazzaville"
    />
  );
}
