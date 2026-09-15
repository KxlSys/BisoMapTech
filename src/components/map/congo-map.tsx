import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Profile } from "@/types";
import { useTheme } from "@/components/theme-provider";
import { escapeHtml } from "@/lib/profile-service";

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const CONGO_CENTER: L.LatLngExpression = [-2.8, 15.2];
const CONGO_ZOOM = 6;

function createMarkerIcon(isCollaborating: boolean, isFocused: boolean) {
  if (isCollaborating) {
    return L.divIcon({
      html: `
        <div style="position:relative;width:12px;height:12px;display:flex;align-items:center;justify-content:center;">
          <div style="background:#10b981;width:12px;height:12px;border-radius:50%;border:2px solid #ffffff;box-shadow:${isFocused ? "0 0 0 4px rgba(16,185,129,0.25), 0 0 10px rgba(16,185,129,0.8)" : "0 0 8px rgba(16,185,129,0.6)"};position:absolute;z-index:2;"></div>
          <div style="background:rgba(16,185,129,0.35);width:${isFocused ? "30px" : "22px"};height:${isFocused ? "30px" : "22px"};border-radius:50%;position:absolute;z-index:1;animation:pulseMarker 1.8s infinite ease-in-out;"></div>
        </div>
      `,
      className: "custom-marker-collaborating",
      iconSize: [isFocused ? 30 : 22, isFocused ? 30 : 22],
      iconAnchor: [isFocused ? 15 : 11, isFocused ? 15 : 11],
      popupAnchor: [0, -10],
    });
  }
  return L.divIcon({
    html: `<div style="background:#6b7280;width:10px;height:10px;border-radius:50%;border:2.5px solid #ffffff;box-shadow:${isFocused ? "0 0 0 4px rgba(16,185,129,0.20), 0 1px 3px rgba(0,0,0,0.35)" : "0 1px 3px rgba(0,0,0,0.3)"}"></div>`,
    className: "custom-marker",
    iconSize: [isFocused ? 18 : 10, isFocused ? 18 : 10],
    iconAnchor: [isFocused ? 9 : 5, isFocused ? 9 : 5],
    popupAnchor: [0, -8],
  });
}

/**
 * Marqueur porteur du drapeau « ouvert à la collaboration », utilisé pour
 * recalculer son icône sans relire le profil. Le nom est préfixé pour ne pas
 * entrer en collision avec les champs internes de Leaflet.
 */
type ProfileMarker = L.Marker & {
  bisoIsCollaborating?: boolean;
  /** Empreinte des champs rendus dans la bulle, pour ne la réécrire qu'utilement. */
  bisoSignature?: string;
  /** Dernier profil connu : le gestionnaire de clic le relit plutôt que de le capturer. */
  bisoProfile?: Profile;
};

/** Champs qui apparaissent dans la bulle : tout changement impose de la réécrire. */
function popupSignature(profile: Profile): string {
  return [
    profile.full_name,
    profile.city,
    profile.username,
    profile.avatar_url,
    profile.tech_stack.slice(0, 3).join("|"),
  ].join("\u0000");
}

function buildPopupContent(profile: Profile): string {
  const safeName = escapeHtml(profile.full_name);
  const safeCity = escapeHtml(profile.city);
  const safeTechs = profile.tech_stack
    .slice(0, 3)
    .map((t) => `<span style="background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.25);padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">${escapeHtml(t)}</span>`)
    .join("");
  const safeUsername = encodeURIComponent(profile.username);
  const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=16a34a&color=fff`;

  return `
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
}

function hasCoordinates(profile: Profile): boolean {
  return typeof profile.latitude === "number" && typeof profile.longitude === "number";
}

interface CongoMapProps {
  profiles: Profile[];
  onProfileClick?: (profile: Profile) => void;
  onMapReady?: (map: L.Map) => void;
  focusedProfileId?: string;
  /** Profil survolé dans la liste latérale : marqueur mis en avant, sans recadrage. */
  highlightedProfileId?: string;
  /** Appelé après chaque déplacement/zoom, pour la recherche dans la zone visible. */
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
}

export const CongoMap = React.memo(function CongoMap({ profiles, onProfileClick, onMapReady, focusedProfileId, highlightedProfileId, onBoundsChange }: CongoMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersMapRef = useRef<Map<string, ProfileMarker>>(new Map());
  // Lus dans l'effet de synchronisation sans en être des dépendances : ils ne
  // doivent jamais déclencher une reconstruction des marqueurs.
  const onProfileClickRef = useRef(onProfileClick);
  const focusedIdRef = useRef(focusedProfileId);
  const highlightedIdRef = useRef(highlightedProfileId);

  useEffect(() => {
    onProfileClickRef.current = onProfileClick;
    focusedIdRef.current = focusedProfileId;
    highlightedIdRef.current = highlightedProfileId;
  }, [onProfileClick, focusedProfileId, highlightedProfileId]);
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
        .congo-cluster { background: transparent; }
        .congo-cluster-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.9);
          color: #ffffff;
          font-weight: 700;
          font-family: system-ui, sans-serif;
          font-size: 13px;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.22), 0 2px 8px rgba(0, 0, 0, 0.45);
          transition: transform 0.15s ease;
        }
        .congo-cluster:hover .congo-cluster-inner { transform: scale(1.08); }
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

    markersRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyDistanceMultiplier: 1.6,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 36 : count < 50 ? 44 : 52;
        return L.divIcon({
          html: `<div class="congo-cluster-inner" style="width:${size}px;height:${size}px;">${count}</div>`,
          className: "congo-cluster",
          iconSize: L.point(size, size),
        });
      },
    }).addTo(mapRef.current);

    // Leaflet mis-positions tiles and markers when its container is resized
    // while hidden (mobile list↔map toggle, sidebar, fullscreen), which throws
    // off centering. Recompute the size on any resize so flyTo lands correctly.
    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    onMapReady?.(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Le déplacement de la carte pilote la liste latérale quand la recherche
  // dans la zone visible est active. La callback est stable côté parent, donc
  // on (re)branche l'écouteur seulement si elle change réellement.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onBoundsChange) return;

    const emit = () => onBoundsChange(map.getBounds());
    map.on("moveend", emit);
    map.on("zoomend", emit);
    emit();

    return () => {
      map.off("moveend", emit);
      map.off("zoomend", emit);
    };
  }, [onBoundsChange]);

  useEffect(() => {
    if (!tileLayerRef.current || !mapRef.current) return;

    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    tileLayerRef.current.setUrl(isDark ? DARK_TILES : LIGHT_TILES);
  }, [theme]);

  // Synchronisation incrémentale des marqueurs.
  //
  // La version précédente vidait le groupe et recréait les 200 marqueurs à
  // chaque changement de `profiles` : chaque frappe dans la recherche jetait
  // des objets Leaflet encore vivants, refermait la bulle ouverte et forçait un
  // recalcul complet des grappes. On compare désormais l'état affiché à l'état
  // demandé, et on ne touche qu'aux marqueurs réellement concernés.
  useEffect(() => {
    const cluster = markersRef.current;
    if (!cluster) return;

    const markers = markersMapRef.current;
    const wanted = new Set<string>();
    const toAdd: ProfileMarker[] = [];
    const toRemove: ProfileMarker[] = [];

    for (const profile of profiles) {
      if (!hasCoordinates(profile)) continue;
      wanted.add(profile.id);

      const isActive =
        profile.id === focusedIdRef.current ||
        profile.id === highlightedIdRef.current;
      const existing = markers.get(profile.id);

      if (!existing) {
        const marker = L.marker([profile.latitude, profile.longitude], {
          icon: createMarkerIcon(profile.open_to_collaboration, isActive),
        }) as ProfileMarker;

        marker.bisoIsCollaborating = profile.open_to_collaboration;
        marker.bisoSignature = popupSignature(profile);
        marker.bisoProfile = profile;

        marker.bindPopup(buildPopupContent(profile), {
          closeButton: true,
          maxWidth: 250,
        });
        // Le profil est relu sur le marqueur : un clic après mise à jour ne
        // remonte pas une version périmée.
        marker.on("click", () => {
          const current = marker.bisoProfile;
          if (current) onProfileClickRef.current?.(current);
        });

        markers.set(profile.id, marker);
        toAdd.push(marker);
        continue;
      }

      existing.bisoProfile = profile;

      const position = existing.getLatLng();
      if (position.lat !== profile.latitude || position.lng !== profile.longitude) {
        // Un marqueur déjà groupé doit sortir de sa grappe avant de bouger,
        // sinon leaflet.markercluster conserve l'ancienne position.
        cluster.removeLayer(existing);
        existing.setLatLng([profile.latitude, profile.longitude]);
        toAdd.push(existing);
      }

      if (existing.bisoIsCollaborating !== profile.open_to_collaboration) {
        existing.bisoIsCollaborating = profile.open_to_collaboration;
        existing.setIcon(
          createMarkerIcon(profile.open_to_collaboration, isActive)
        );
      }

      const signature = popupSignature(profile);
      if (existing.bisoSignature !== signature) {
        existing.bisoSignature = signature;
        existing.setPopupContent(buildPopupContent(profile));
      }
    }

    for (const [id, marker] of markers) {
      if (!wanted.has(id)) {
        toRemove.push(marker);
        markers.delete(id);
      }
    }

    // Ajouts et retraits groupés : markercluster ne recalcule ses grappes
    // qu'une fois, au lieu d'une fois par marqueur.
    if (toRemove.length > 0) cluster.removeLayers(toRemove);
    if (toAdd.length > 0) cluster.addLayers(toAdd);
  }, [profiles]);

  const prevFocusedIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const map = mapRef.current;
    const cluster = markersRef.current;

    // Seules les icônes concernées changent, jamais l'ensemble des marqueurs.
    if (prevFocusedIdRef.current && prevFocusedIdRef.current !== focusedProfileId) {
      const prevMarker = markersMapRef.current.get(prevFocusedIdRef.current);
      // Un marqueur encore survolé garde sa mise en avant.
      if (prevMarker && prevFocusedIdRef.current !== highlightedIdRef.current) {
        prevMarker.setIcon(createMarkerIcon(!!prevMarker.bisoIsCollaborating, false));
      }
    }

    if (focusedProfileId) {
      const newMarker = markersMapRef.current.get(focusedProfileId);
      if (newMarker) {
        newMarker.setIcon(createMarkerIcon(!!newMarker.bisoIsCollaborating, true));
      }
    }

    prevFocusedIdRef.current = focusedProfileId;

    if (!focusedProfileId || !map || !cluster) return;

    const marker = markersMapRef.current.get(focusedProfileId);
    if (!marker) return;

    // The container may have just become visible (mobile/fullscreen toggle), so
    // make sure Leaflet knows its real size before computing the centering.
    map.invalidateSize();

    const reveal = () => {
      // Profiles share a single city coordinate, so the focused one is usually
      // inside a cluster — zoomToShowLayer spiderfies it open, then we show its card.
      cluster.zoomToShowLayer(marker, () => marker.openPopup());
    };

    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 11), {
      animate: true,
      duration: 1.2,
    });
    map.once("moveend", reveal);

    return () => {
      map.off("moveend", reveal);
    };
  }, [focusedProfileId]);

  const prevHighlightedIdRef = useRef<string | undefined>(undefined);

  // Survol depuis la liste : on change uniquement l'icône, sans flyTo ni popup,
  // pour que le pointeur puisse balayer la liste sans faire bouger la carte.
  useEffect(() => {
    const previous = prevHighlightedIdRef.current;

    if (previous && previous !== highlightedProfileId) {
      const prevMarker = markersMapRef.current.get(previous);
      // Le marqueur focalisé garde son icône : le survol ne doit pas l'éteindre.
      if (prevMarker && previous !== focusedProfileId) {
        prevMarker.setIcon(createMarkerIcon(!!prevMarker.bisoIsCollaborating, false));
      }
    }

    if (highlightedProfileId) {
      const marker = markersMapRef.current.get(highlightedProfileId);
      if (marker) {
        marker.setIcon(createMarkerIcon(!!marker.bisoIsCollaborating, true));
      }
    }

    prevHighlightedIdRef.current = highlightedProfileId;
  }, [highlightedProfileId, focusedProfileId]);

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
