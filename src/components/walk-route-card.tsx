import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteMap } from "@/components/map/route-map";
import { Route3DToggle } from "@/components/map/route-3d-toggle";
import { RouteElevationChart } from "@/components/route-elevation-chart";
import {
  formatMiles,
  formatWalkEstimate,
  isCircular,
  parseRoutePoints,
} from "@/lib/route-geometry";
import { parseElevationProfile } from "@/lib/gpx";

/** "EASY" → "Easy". */
function difficultyLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

/**
 * The route as members see it: the line on a map, the distance, and a rough
 * time. Renders nothing when the walk has no route — every walk created
 * before routes existed is in that state, and an empty map would be worse
 * than no map.
 */
export function WalkRouteCard({
  route,
}: {
  route: {
    name: string;
    notes: string | null;
    points: unknown;
    distanceMetres: number;
    elevationGainMetres: number | null;
    elevationProfile?: unknown;
    difficulty: string | null;
  } | null;
}) {
  if (!route) return null;
  const points = parseRoutePoints(route.points);
  if (points.length < 2) return null;
  const elevationProfile = parseElevationProfile(route.elevationProfile, points.length);

  return (
    <Card className="gap-4 overflow-hidden py-0">
      <CardHeader className="px-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">The route</CardTitle>
          {route.difficulty ? (
            <Badge variant="secondary">{difficultyLabel(route.difficulty)}</Badge>
          ) : null}
        </div>
        <CardDescription>
          {formatMiles(route.distanceMetres)}
          {" · "}
          {formatWalkEstimate(route.distanceMetres)}
          {isCircular(points) ? " · circular" : null}
          {route.elevationGainMetres != null
            ? ` · ${Math.round(route.elevationGainMetres)} m ascent`
            : null}
        </CardDescription>
      </CardHeader>

      <div className="border-y">
        <RouteMap points={points} />
      </div>

      <CardContent className="flex flex-col gap-2 px-6 pb-6">
        <p className="text-sm font-medium">{route.name}</p>
        {route.notes ? <p className="text-sm text-muted-foreground">{route.notes}</p> : null}
        {elevationProfile ? (
          <RouteElevationChart className="pt-2" elevations={elevationProfile} points={points} />
        ) : null}
        <Route3DToggle points={points} />
        <p className="text-xs text-muted-foreground">
          Treat the distance as a guide for deciding whether this walk suits you, not an exact
          measurement.
        </p>
      </CardContent>
    </Card>
  );
}
