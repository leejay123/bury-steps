"use client";

/**
 * A tilted, real-terrain view of a saved route — the "3D" ask, answered
 * without a new account or paid tile provider. Two free, keyless sources
 * make the whole thing work:
 *  - Colour and cartography: OpenFreeMap's hosted "Liberty" vector style —
 *    proper roads, land use, and 3D-extruded buildings at closer zoom,
 *    not just a flat street-map raster drape. Free, no key, no account;
 *    OpenFreeMap is a public service funded to stay that way, unlike most
 *    vector-tile hosts which meter usage behind a signup.
 *  - Shape: the "Terrarium" elevation tiles from Mapzen's old Elevation
 *    Tiles project, still mirrored by AWS's Open Data program and released
 *    into the public domain — the exact source MapLibre's own terrain
 *    demos use. No signup, no key, nothing that can expire or start
 *    billing later. Layered on top of OpenFreeMap's style, which has no
 *    elevation data of its own.
 *
 * This whole module only ever loads in the browser, behind a click (see
 * route-3d-toggle.tsx's React.lazy boundary) — WebGL and a ~200KB library
 * for something most page views won't open, so it should never be part of
 * the walk page's initial download.
 *
 * Both hosts need their own connect-src entry in next.config.ts's CSP —
 * MapLibre fetches every source (including this raster-dem one) via
 * fetch()/XHR into a WebGL texture, not <img> tags the way Leaflet's tiles
 * do elsewhere on the site, so img-src's already-open https: doesn't cover
 * it.
 */

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";
import { routeBounds, type RoutePoint } from "@/lib/route-geometry";

const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const TERRAIN_TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const TERRAIN_ATTRIBUTION = "Elevation: AWS Open Data / Mapzen Terrarium (public domain)";
/** Native resolution of the public Terrarium tileset — asking past this
 * just reuses the closest tile, which MapLibre already does on its own. */
const TERRAIN_MAX_ZOOM = 15;
/** A gentle boost: Bury's hills are real but subtle at true 1:1 scale, and
 * without some exaggeration a "3D" view would barely look different from
 * flat. Purely a display choice — the elevation chart and gain/loss
 * figures elsewhere are never touched by this. */
const TERRAIN_EXAGGERATION = 1.5;

function makeDotElement(color: string, label: string): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", label);
  el.style.cssText = `width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);`;
  return el;
}

export function RouteMap3D({ points, className }: { points: RoutePoint[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || points.length < 2) return;

    let map: MapLibreMap | null = null;
    try {
      const bounds = routeBounds(points);
      const centre = bounds
        ? [(bounds.west + bounds.east) / 2, (bounds.south + bounds.north) / 2]
        : [points[0].lng, points[0].lat];

      map = new MapLibreMap({
        container,
        style: OPENFREEMAP_STYLE_URL,
        center: centre as [number, number],
        zoom: 13,
        pitch: 55,
        attributionControl: { compact: true },
      });

      map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");

      map.on("load", () => {
        if (!map) return;
        // Not part of OpenFreeMap's own style — it has no elevation data —
        // so this is added ourselves once the base style has finished
        // loading, same as the route line below.
        map.addSource("terrain", {
          type: "raster-dem",
          tiles: [TERRAIN_TILE_URL],
          tileSize: 256,
          encoding: "terrarium",
          maxzoom: TERRAIN_MAX_ZOOM,
          attribution: TERRAIN_ATTRIBUTION,
        });
        map.setTerrain({ source: "terrain", exaggeration: TERRAIN_EXAGGERATION });

        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: points.map((p) => [p.lng, p.lat]) },
          },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#2563eb", "line-width": 4 },
        });

        new Marker({ element: makeDotElement("#16a34a", "Start") })
          .setLngLat([points[0].lng, points[0].lat])
          .addTo(map);
        if (points.length > 1) {
          const last = points[points.length - 1];
          new Marker({ element: makeDotElement("#dc2626", "Finish") }).setLngLat([last.lng, last.lat]).addTo(map);
        }

        if (bounds) {
          map.fitBounds(
            [
              [bounds.west, bounds.south],
              [bounds.east, bounds.north],
            ],
            { padding: 48, pitch: 55, duration: 0 },
          );
        }
      });
    } catch {
      // Most likely no WebGL (an old browser, or it's disabled) — the flat
      // map above this still works fine either way. Deferred a tick so this
      // doesn't set state synchronously inside the effect body itself.
      queueMicrotask(() => setError("3D view needs a browser with WebGL turned on."));
    }

    return () => {
      map?.remove();
    };
  }, [points]);

  if (points.length < 2) return null;

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      {error ? (
        <p className="p-4 text-sm text-muted-foreground">{error}</p>
      ) : (
        <div className="h-72 w-full bg-muted sm:h-96" ref={containerRef} />
      )}
    </div>
  );
}

export default RouteMap3D;
