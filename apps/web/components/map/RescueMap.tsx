"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";

export interface MapMarkerPoint {
  id: string;
  label: string;
  sublabel?: string;
  lat: number;
  lon: number;
  kind: "donor" | "receiver" | "volunteer";
}

interface RescueMapProps {
  points: MapMarkerPoint[];
  routeCoords?: [number, number][]; // [[lon, lat], ...]
  heightClass?: string;
}

export function RescueMap({
  points,
  routeCoords,
  heightClass = "h-72",
}: RescueMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    let mapInstance: import("maplibre-gl").Map | null = null;
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current) return;
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled || !containerRef.current) return;

        const center: [number, number] =
          points.length > 0 ? [points[0].lon, points[0].lat] : [72.5714, 23.0225];

        mapInstance = new maplibregl.Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors",
              },
            },
            layers: [
              {
                id: "osm",
                type: "raster",
                source: "osm",
              },
            ],
          },
          center,
          zoom: 12,
        });

        mapInstance.on("error", () => {
          setFallbackActive(true);
        });

        mapInstance.on("load", () => {
          if (!mapInstance || cancelled) return;
          setMapReady(true);

          for (const pt of points) {
            const el = document.createElement("div");
            el.className = "flex items-center justify-center rounded-full shadow-md border-2 border-white";
            el.style.width = "18px";
            el.style.height = "18px";
            el.style.backgroundColor =
              pt.kind === "donor"
                ? "#FF5C1F"
                : pt.kind === "receiver"
                ? "#00B8A9"
                : "#FF3D8B";
            new maplibregl.Marker({ element: el })
              .setLngLat([pt.lon, pt.lat])
              .setPopup(
                new maplibregl.Popup({ offset: 14 }).setHTML(
                  `<strong>${pt.label}</strong>${pt.sublabel ? `<br/><span>${pt.sublabel}</span>` : ""}`
                )
              )
              .addTo(mapInstance);
          }

          if (routeCoords && routeCoords.length >= 2) {
            mapInstance.addSource("rescue-route", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: routeCoords,
                },
              },
            });
            mapInstance.addLayer({
              id: "rescue-route-line",
              type: "line",
              source: "rescue-route",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#00B8A9",
                "line-width": 4,
                "line-dasharray": [2, 1.5],
              },
            });
          }
        });
      } catch {
        setFallbackActive(true);
      }
    }

    void initMap();
    return () => {
      cancelled = true;
      mapInstance?.remove();
    };
  }, [points, routeCoords]);

  return (
    <div className={`relative w-full overflow-hidden rounded-[24px] border border-white/80 bg-teal-50/70 ${heightClass}`}>
      <div ref={containerRef} className="h-full w-full" />

      {/* Clean Interactive SVG Fallback if offline / WebGL unavailable */}
      {(!mapReady || fallbackActive) && (
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-teal-50 via-mist to-tangerine-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-ink shadow-sm">
              <Navigation className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              Ahmedabad Geo Preview (MapLibre + OSM Ready)
            </span>
            <span className="text-[11px] font-semibold text-ink/60">
              Exact pins locked until match
            </span>
          </div>

          <svg viewBox="0 0 400 160" className="my-2 h-32 w-full" aria-hidden="true">
            <path
              d="M35 120 Q 140 40, 220 85 T 365 45"
              fill="none"
              stroke="#00B8A9"
              strokeWidth="4"
              strokeDasharray="8 6"
            />
            {points.slice(0, 5).map((p, idx) => {
              const cx = 45 + idx * 78;
              const cy = idx % 2 === 0 ? 110 : 52;
              const fill =
                p.kind === "donor" ? "#FF5C1F" : p.kind === "receiver" ? "#00B8A9" : "#FF3D8B";
              return (
                <g key={p.id}>
                  <circle cx={cx} cy={cy} r="10" fill={fill} stroke="#FFFFFF" strokeWidth="3" />
                  <text
                    x={cx}
                    y={cy + 22}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#0B2A2E"
                  >
                    {p.label.slice(0, 14)}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="flex flex-wrap gap-2">
            {points.map((pt) => (
              <span
                key={pt.id}
                className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-ink"
              >
                <MapPin
                  className={`h-3 w-3 ${
                    pt.kind === "donor"
                      ? "text-tangerine"
                      : pt.kind === "receiver"
                      ? "text-teal-700"
                      : "text-berry"
                  }`}
                  aria-hidden="true"
                />
                {pt.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

