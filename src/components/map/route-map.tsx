"use client";

import { useEffect, useRef } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import type { RoutePoint } from "@/lib/route-geometry";
import {
  DEFAULT_CENTRE,
  DEFAULT_ZOOM,
  OPENTOPOMAP_ATTRIBUTION,
  OPENTOPOMAP_MAX_ZOOM,
  OPENTOPOMAP_TILE_URL,
  dotIcon,
  useLeaflet,
} from "./use-leaflet";

/**
 * Draws a saved route. Read-only — this is what members see on the walk
 * page. Nothing is fetched beyond map tiles; the line comes from points
 * already stored on the walk.
 */
export function RouteMap({
  points,
  className,
  interactive = true,
}: {
  points: RoutePoint[];
  className?: string;
  /** Off inside cards where the map shouldn't swallow a page scroll. */
  interactive?: boolean;
}) {
  const leaflet = useLeaflet();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!leaflet || !container || points.length === 0) return;

    const map = leaflet.map(container, {
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: false,
      touchZoom: interactive,
      doubleClickZoom: interactive,
      zoomControl: interactive,
      keyboard: interactive,
    });
    mapRef.current = map;

    leaflet
      .tileLayer(OPENTOPOMAP_TILE_URL, { attribution: OPENTOPOMAP_ATTRIBUTION, maxZoom: OPENTOPOMAP_MAX_ZOOM })
      .addTo(map);

    const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
    const line = leaflet.polyline(latLngs, { weight: 5, opacity: 0.9, color: "#2563eb" });
    line.addTo(map);

    leaflet.marker(latLngs[0], { icon: dotIcon(leaflet, "start"), keyboard: false }).addTo(map);
    if (latLngs.length > 1) {
      leaflet
        .marker(latLngs[latLngs.length - 1], { icon: dotIcon(leaflet, "finish"), keyboard: false })
        .addTo(map);
    }

    map.fitBounds(line.getBounds(), { padding: [24, 24] });

    // The card can be laid out before the map knows its own size (inside a
    // drawer, an accordion, or simply on first paint), which leaves grey
    // gaps where tiles never loaded. Nudging it once the browser has
    // settled fixes it.
    const settle = window.setTimeout(() => map.invalidateSize(), 120);

    return () => {
      window.clearTimeout(settle);
      map.remove();
      mapRef.current = null;
    };
  }, [leaflet, points, interactive]);

  if (points.length === 0) return null;

  return (
    <div
      className={cn("relative h-64 w-full bg-muted", className)}
      // Leaflet renders its own controls and attribution into this node.
      ref={containerRef}
      role="img"
      aria-label="Map showing the walking route"
    >
      {!leaflet ? (
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse bg-muted"
          style={{ zIndex: 0 }}
        />
      ) : null}
    </div>
  );
}

export default RouteMap;

/** Fallback centre for an editor with no points yet. */
export const ROUTE_MAP_DEFAULTS = { centre: DEFAULT_CENTRE, zoom: DEFAULT_ZOOM };
