"use client";

/**
 * Loads the 3D terrain view only once someone actually asks for it — the
 * flat map above this is the default for a reason (fast, works everywhere,
 * no WebGL dependency), so nobody should pay for MapLibre's ~200KB and a
 * WebGL context just to view a walk page. React.lazy splits route-map-3d
 * (and its static "maplibre-gl" import) into its own chunk that only
 * downloads on the click below.
 */

import { lazy, Suspense, useState } from "react";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoutePoint } from "@/lib/route-geometry";

const RouteMap3D = lazy(() => import("./route-map-3d"));

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
        <Suspense fallback={<div className="h-72 w-full animate-pulse rounded-lg bg-muted sm:h-96" />}>
          <RouteMap3D points={points} />
        </Suspense>
      ) : null}
    </div>
  );
}

export default Route3DToggle;
