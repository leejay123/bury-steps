import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteMap } from "@/components/map/route-map";
import {
  formatMiles,
  formatWalkEstimate,
  isCircular,
  parseRoutePoints,
} from "@/lib/route-geometry";

/**
 * The route as members see it: the line on a map, the distance, and a rough
 * time. Renders nothing when the walk has no route — every walk created
 * before routes existed is in that state, and an empty map would be worse
 * than no map.
 */
export function WalkRouteCard({
  route,
}: {
  route: { name: string; notes: string | null; points: unknown; distanceMetres: number } | null;
}) {
  if (!route) return null;
  const points = parseRoutePoints(route.points);
  if (points.length < 2) return null;

  return (
    <Card className="gap-4 overflow-hidden py-0">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-base">The route</CardTitle>
        <CardDescription>
          {formatMiles(route.distanceMetres)}
          {" · "}
          {formatWalkEstimate(route.distanceMetres)}
          {isCircular(points) ? " · circular" : null}
        </CardDescription>
      </CardHeader>

      <div className="border-y">
        <RouteMap points={points} />
      </div>

      <CardContent className="flex flex-col gap-2 px-6 pb-6">
        <p className="text-sm font-medium">{route.name}</p>
        {route.notes ? <p className="text-sm text-muted-foreground">{route.notes}</p> : null}
        <p className="text-xs text-muted-foreground">
          The distance is a guide — the route is drawn by hand, so treat it as roughly right
          rather than exact.
        </p>
      </CardContent>
    </Card>
  );
}
