"use client";

/**
 * Loads the 3D terrain view only once someone actually asks for it — the
 * flat map above this (route-map.tsx) is the guaranteed-to-work default,
 * so nobody should pay for MapLibre's ~200KB and a WebGL context, or risk
 * its fetch-based tile loading hanging on a hostile network, just to view
 * a walk page. React.lazy splits route-map-view-impl.tsx (and its static
 * maplibre-gl import) into its own chunk that only downloads on the click
 * below, wrapped in an error boundary in case even that chunk fails to
 * download.
 */

import { lazy, Suspense, useState } from "react";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoutePoint } from "@/lib/route-geometry";
import { MapErrorBoundary } from "./map-error-boundary";

const RouteMapViewImpl = lazy(() => import("./route-map-view-impl"));

export function Route3DToggle({ points }: { points: RoutePoint[] }) {
  const [show, setShow] = useState(false);

  if (points.length < 2) return null;

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="self-start"
        onClick={() => setShow((current) => !current)}
        size="sm"
        type="button"
        variant="outline"
      >
        <Box className="size-4" />
        {show ? "Hide 3D view" : "View in 3D"}
      </Button>
      {show ? (
        <MapErrorBoundary
          fallback={
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              The 3D view could not be loaded. The map above still works fine.
            </div>
          }
        >
          <Suspense fallback={<div className="h-72 w-full animate-pulse rounded-lg border bg-muted sm:h-96" />}>
            <RouteMapViewImpl points={points} startTilted />
          </Suspense>
        </MapErrorBoundary>
      ) : null}
    </div>
  );
}

export default Route3DToggle;
