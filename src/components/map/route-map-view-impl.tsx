"use client";

/**
 * The one map members and admins see for a route — flat by default, with
 * a button that tilts the SAME map into a 3D terrain view instead of
 * swapping to a second map engine (which is what this replaced: a Leaflet
 * flat map plus a separate MapLibre 3D one, two tile providers and two
 * code paths for what is, to anyone looking at it, one feature).
 *
 * Runs on MapTiler Cloud (map style + terrain, one key covers both) rather
 * than a keyless combination this project tried first — that one (OSM
 * raster tiles or OpenFreeMap's hosted vector style, draped with public
 * Terrarium elevation tiles from a bare AWS S3 bucket) looked appealing
 * for needing no signup, but OpenFreeMap in particular is one person's two
 * Hetzner servers with no CDN and no uptime promise, and it showed exactly
 * that in practice — requests that neither succeeded nor failed, just
 * hung. MapTiler's free tier (100k map loads/month, no card) is backed by
 * real CDN infrastructure instead. See maptiler-config.ts for the key.
 *
 * MapTiler's own domain needs its own connect-src entry in next.config.ts's
 * CSP — MapLibre fetches every source via fetch()/XHR into a WebGL
 * texture, not <img> tags the way the old Leaflet maps did elsewhere on
 * the site, so img-src's already-open https: doesn't cover it.
 */

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { maptilerApiKey, maptilerStyleUrl, maptilerTerrainUrl } from "@/lib/maptiler-config";
import { routeBounds, type RoutePoint } from "@/lib/route-geometry";

/** A gentle boost: Bury's hills are real but subtle at true 1:1 scale, and
 * without some exaggeration "3D" would barely look different from flat. */
const TERRAIN_EXAGGERATION = 1.5;
const FLAT_PITCH = 0;
const TILTED_PITCH = 55;

function makeDotElement(color: string, label: string): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", label);
  el.style.cssText = `width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);`;
  return el;
}

export function RouteMapViewImpl({ points, className }: { points: RoutePoint[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [tilted, setTilted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = maptilerApiKey();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || points.length < 2 || !apiKey) return;

    let map: MapLibreMap | null = null;
    let loaded = false;
    let loadTimeout: number | undefined;
    try {
      const bounds = routeBounds(points);
      const centre = bounds
        ? [(bounds.west + bounds.east) / 2, (bounds.south + bounds.north) / 2]
        : [points[0].lng, points[0].lat];

      map = new MapLibreMap({
        container,
        style: maptilerStyleUrl(apiKey),
        center: centre as [number, number],
        zoom: 13,
        pitch: FLAT_PITCH,
        // Matches the old Leaflet map's scrollWheelZoom:false — a route
        // preview inside a page shouldn't swallow a trackpad scroll.
        scrollZoom: false,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.addControl(new NavigationControl({ visualizePitch: true, showZoom: true }), "top-right");

      // A failure before the style has ever loaded means the map itself
      // never came up — worth telling someone. A failure afterwards (a
      // dropped tile at the edge of the world, a flaky request while
      // panning) is normal and shouldn't blank out an otherwise-working
      // map, so it's just logged.
      map.on("error", (event) => {
        console.error("Route map error:", event.error);
        if (!loaded) {
          queueMicrotask(() => setError("Could not load the map right now. Try again in a moment."));
        }
      });

      // Belt and braces: a request that hangs rather than fails outright
      // fires neither 'load' nor 'error' — without this, that leaves an
      // empty map and a permanently-disabled button with no explanation.
      loadTimeout = window.setTimeout(() => {
        if (!loaded) setError("The map is taking too long to load. Try again in a moment.");
      }, 12_000);
      map.once("load", () => window.clearTimeout(loadTimeout));

      map.on("load", () => {
        if (!map) return;
        loaded = true;

        // Everything below runs after the base style has finished loading,
        // so it can throw synchronously for reasons that have nothing to
        // do with network failures (an id collision with a source/layer
        // the loaded style already defines, most notably) — caught here so
        // that fails loudly with a real message instead of leaving the map
        // stuck looking "still loading" forever with nothing to explain it.
        try {
          map.addSource("burysteps-terrain", {
            type: "raster-dem",
            url: maptilerTerrainUrl(apiKey),
            encoding: "terrarium",
          });

          map.addSource("burysteps-route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: points.map((p) => [p.lng, p.lat]) },
            },
          });
          map.addLayer({
            id: "burysteps-route-line",
            type: "line",
            source: "burysteps-route",
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
              { padding: 48, duration: 0 },
            );
          }
          setReady(true);
        } catch (err) {
          console.error("Route map failed to add the route to it:", err);
          setError("Could not show the route on the map right now. Try again in a moment.");
        }
      });
    } catch (err) {
      // Most likely no WebGL (an old browser, or it's disabled). Deferred
      // a tick so this doesn't set state synchronously inside the effect.
      console.error("Route map failed to initialise:", err);
      queueMicrotask(() => setError("This map needs a browser with WebGL turned on."));
    }

    return () => {
      window.clearTimeout(loadTimeout);
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [points, apiKey]);

  const toggleTilt = () => {
    const map = mapRef.current;
    if (!map || !ready || !apiKey) return;
    const next = !tilted;
    try {
      if (next) {
        map.setTerrain({ source: "burysteps-terrain", exaggeration: TERRAIN_EXAGGERATION });
        map.easeTo({ pitch: TILTED_PITCH, duration: 800 });
      } else {
        map.setTerrain(null);
        map.easeTo({ pitch: FLAT_PITCH, duration: 800 });
      }
      setTilted(next);
    } catch (err) {
      console.error("Route map failed to tilt:", err);
      setError("Could not switch to 3D right now. Try again in a moment.");
    }
  };

  if (points.length < 2) return null;

  if (!apiKey) {
    return (
      <div className={cn("rounded-lg border p-4 text-sm text-muted-foreground", className)}>
        The map isn&apos;t set up yet — ask whoever runs the site to add a free MapTiler key.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="overflow-hidden rounded-lg border">
        {error ? (
          <p className="p-4 text-sm text-muted-foreground">{error}</p>
        ) : (
          <div className="h-72 w-full bg-muted sm:h-96" ref={containerRef} />
        )}
      </div>
      {!error ? (
        <Button className="self-start" disabled={!ready} onClick={toggleTilt} size="sm" type="button" variant="outline">
          <Box className="size-4" />
          {tilted ? "Flatten map" : "Tilt to 3D"}
        </Button>
      ) : null}
    </div>
  );
}

export default RouteMapViewImpl;
