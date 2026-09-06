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
 *
 * That chunk and MapTiler's own connection are still warmed ahead of the
 * click, once the browser is idle: most people who scroll to a route do
 * open the 3D view, and by then the code is already parsed and the DNS/TLS
 * handshake to api.maptiler.com already done, so "View in 3D" itself pays
 * for none of that — only the actual style/tile fetches remain, which is
 * what makes it feel instant. Nobody who never scrolls this far pays
 * anything, since the warm-up only runs once this component has mounted.
 */

import { lazy, Suspense, useEffect, useState } from "react";
import { preconnect } from "react-dom";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { maptilerApiKey, maptilerStyleUrl } from "@/lib/maptiler-config";
import type { RoutePoint } from "@/lib/route-geometry";
import { MapErrorBoundary } from "./map-error-boundary";

const RouteMapViewImpl = lazy(() => import("./route-map-view-impl"));
const MAPTILER_ORIGIN = "https://api.maptiler.com";

/** requestIdleCallback isn't in Safari; a short timeout is close enough —
 * the point is just "after the stuff actually on screen", not precision. */
function onIdle(run: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 200);
  return () => window.clearTimeout(id);
}

export function Route3DToggle({ points }: { points: RoutePoint[] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (points.length < 2) return;
    preconnect(MAPTILER_ORIGIN, { crossOrigin: "anonymous" });
    return onIdle(() => {
      void import("./route-map-view-impl");
      const apiKey = maptilerApiKey();
      // Just the style manifest, not the tiles it references — enough to
      // avoid one full request/response round trip on click without
      // fetching data for a view most visitors haven't asked for yet.
      if (apiKey) void fetch(maptilerStyleUrl(apiKey), { priority: "low" }).catch(() => {});
    });
  }, [points.length]);

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
