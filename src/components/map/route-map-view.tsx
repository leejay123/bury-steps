"use client";

/**
 * Lazy-loading boundary for the map — route-map-view-impl.tsx's static
 * "maplibre-gl" import can't run during the server render (it touches
 * `window` at module load), so it's split into its own chunk via
 * React.lazy and only ever evaluated in the browser. Wrapped in an error
 * boundary too, since a failed chunk download (a bad connection, an ad
 * blocker) would otherwise throw during render and take the rest of the
 * walk page down with it.
 */

import { lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import type { RoutePoint } from "@/lib/route-geometry";
import { MapErrorBoundary } from "./map-error-boundary";

const RouteMapViewImpl = lazy(() => import("./route-map-view-impl"));

export function RouteMapView({ points, className }: { points: RoutePoint[]; className?: string }) {
  if (points.length < 2) return null;

  return (
    <MapErrorBoundary
      fallback={
        <div className={cn("rounded-lg border p-4 text-sm text-muted-foreground", className)}>
          The map could not be loaded. Try refreshing the page.
        </div>
      }
    >
      <Suspense fallback={<div className={cn("h-72 w-full animate-pulse rounded-lg border bg-muted sm:h-96", className)} />}>
        <RouteMapViewImpl className={className} points={points} />
      </Suspense>
    </MapErrorBoundary>
  );
}

export default RouteMapView;
