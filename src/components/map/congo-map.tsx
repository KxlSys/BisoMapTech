import React, { useEffect, useRef } from "react";
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

function createMarkerIcon(isCollaborating: boolean) {
  if (isCollaborating) {
    return L.divIcon({
      html: `
        <div style="position:relative;width:12px;height:12px;display:flex;align-items:center;justify-content:center;">
          <div style="background:#10b981;width:12px;height:12px;border-radius:50%;border:2px solid #ffffff;box-shadow:0 0 8px rgba(16,185,129,0.6);position:absolute;z-index:2;"></div>
          <div style="background:rgba(16,185,129,0.35);width:22px;height:22px;border-radius:50%;position:absolute;z-index:1;animation:pulseMarker 1.8s infinite ease-in-out;"></div>
        </div>
      `,
      className: "custom-marker-collaborating",
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -10],
    });
  }
  return L.divIcon({
    html: `<div style="background:#6b7280;width:10px;height:10px;border-radius:50%;border:2.5px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
    className: "custom-marker",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  });
}

interface CongoMapProps {
  profiles: Profile[];
  onProfileClick?: (profile: Profile) => void;
  onMapReady?: (map: L.Map) => void;
  focusedProfileId?: string;
}

export const CongoMap = React.memo(function CongoMap({ profiles, onProfileClick, onMapReady, focusedProfileId }: CongoMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const { theme } = useTheme();

  // Injecter les animations CSS et les surcharges Leaflet de style premium
  useEffect(() => {
    const styleId = "congo-map-animations";
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

    profiles.forEach((profile) => {
      if (!profile.latitude || !profile.longitude) return;

      const marker = L.marker([profile.latitude, profile.longitude], {
        icon: createMarkerIcon(profile.open_to_collaboration),
      });

      const safeName = escapeHtml(profile.full_name);
      const safeCity = escapeHtml(profile.city);
      const safeTechs = profile.tech_stack
        .slice(0, 3)
        .map((t) => `<span style="background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.25);padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">${escapeHtml(t)}</span>`)
        .join("");
      const safeUsername = encodeURIComponent(profile.username);
      const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=16a34a&color=fff`;

      const popupContent = `
        <div style="min-width:190px;font-family:system-ui,sans-serif;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <img src="${escapeHtml(avatarUrl)}"
                 alt=""
                 style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(255,255,255,0.15);"
                 onerror="this.style.display='none'" />
            <div>
              <div style="font-weight:700;font-size:13.5px;color:#f3f4f6;line-height:1.2;">${safeName}</div>
              <div style="font-size:11px;color:#9ca3af;margin-top:2px;">📍 ${safeCity}</div>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
            ${safeTechs}
          </div>
          <a href="/contributeurs/${safeUsername}"
             style="display:block;text-align:center;background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:white;padding:7px 12px;border-radius:8px;font-size:11px;text-decoration:none;font-weight:700;box-shadow:0 3px 8px rgba(16,185,129,0.25);transition:transform 0.15s ease;">
            Voir le profil &rarr;
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: true, maxWidth: 250 });

      marker.on("click", () => {
        onProfileClick?.(profile);
      });

      markersRef.current!.addLayer(marker);
      markersMapRef.current.set(profile.id, marker);
    });
  }, [profiles, onProfileClick]);

  useEffect(() => {
    if (!focusedProfileId || !mapRef.current || !markersMapRef.current) return;

    const marker = markersMapRef.current.get(focusedProfileId);
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
  }, [focusedProfileId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg border border-border"
      style={{ minHeight: "400px" }}
      role="application"
      aria-label="Carte interactive des développeurs en République du Congo"
    />
  );
});
