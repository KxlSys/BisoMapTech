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
    html: `
      <div style="position:relative;width:12px;height:12px;display:flex;align-items:center;justify-content:center;">
        <div style="background:var(--tertiary, #06b6d4);width:12px;height:12px;border-radius:50%;border:2px solid #ffffff;box-shadow:0 0 8px rgba(6,180,212,0.6);position:absolute;z-index:2;"></div>
        <div style="background:rgba(6,180,212,0.35);width:22px;height:22px;border-radius:50%;position:absolute;z-index:1;animation:pulseMarker 1.8s infinite ease-in-out;"></div>
      </div>
    `,
    className: "custom-marker-place",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10],
  });
}

interface PlacesMapProps {
  places: Place[];
  onMapReady?: (map: L.Map) => void;
  focusedPlaceId?: string;
}

export function PlacesMap({ places, onMapReady, focusedPlaceId }: PlacesMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const { theme } = useTheme();

  // Injecter les animations CSS et les surcharges Leaflet de style premium
  useEffect(() => {
    const styleId = "places-map-animations";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes pulseMarker {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-container {
          background: #090d16 !important;
        }
        .light .leaflet-container {
          background: #f3f4f6 !important;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          color: #f3f4f6 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(12px) !important;
          padding: 4px !important;
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .leaflet-popup-close-button {
          color: #9ca3af !important;
          padding: 8px 8px 0 0 !important;
        }
        .leaflet-popup-content {
          margin: 12px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: CONGO_CENTER,
      zoom: CONGO_ZOOM,
      zoomControl: false,
      attributionControl: true,
      minZoom: 2,
      maxZoom: 13,
      worldCopyJump: true,
      maxBounds: [
        [-85, -360],
        [85, 360],
      ],
      maxBoundsViscosity: 1.0,
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
    markersMapRef.current.clear();

    places.forEach((place) => {
      if (!place.latitude || !place.longitude) return;

      const marker = L.marker([place.latitude, place.longitude], {
        icon: createMarkerIcon(),
      });

      const safeName = escapeHtml(place.name);
      const safeCity = escapeHtml(place.city || "");
      const safeCategory = escapeHtml(place.category);

      const popupContent = `
        <div style="min-width:190px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:13.5px;color:#f3f4f6;line-height:1.2;margin-bottom:2px">${safeName}</div>
          <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">📍 ${safeCity}</div>
          <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(6,180,212,0.12);color:#06b6d4;border:1px solid rgba(6,180,212,0.25);padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;margin-bottom:12px">
            ${safeCategory}
          </div>
          <a href="/lieux/${escapeHtml(place.id)}"
             style="display:block;text-align:center;background:linear-gradient(135deg, var(--tertiary, #06b6d4) 0%, #0891b2 100%);color:white;padding:7px 12px;border-radius:8px;font-size:11px;text-decoration:none;font-weight:700;box-shadow:0 3px 8px rgba(6,180,212,0.25);transition:transform 0.15s ease;">
            Voir la fiche &rarr;
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: true, maxWidth: 260 });
      markersRef.current!.addLayer(marker);
      markersMapRef.current.set(place.id, marker);
    });
  }, [places]);

  useEffect(() => {
    if (!focusedPlaceId || !mapRef.current || !markersMapRef.current) return;

    const marker = markersMapRef.current.get(focusedPlaceId);
    if (marker) {
      mapRef.current.flyTo(marker.getLatLng(), 11, {
        animate: true,
        duration: 1.5,
      });

      const timer = setTimeout(() => {
        marker.openPopup();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [focusedPlaceId]);

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
