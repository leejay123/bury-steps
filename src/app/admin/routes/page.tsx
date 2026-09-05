import Link from "next/link";
import { Plus, Route as RouteIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatMiles, parseRoutePoints } from "@/lib/route-geometry";
import { AdminPageIntro } from "../admin-page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

/** "EASY" → "Easy". */
function difficultyLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default async function RoutesPage() {
  await requireAdmin();

  const routes = await prisma.walkRoute.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      notes: true,
      points: true,
      distanceMetres: true,
      elevationGainMetres: true,
      difficulty: true,
      _count: { select: { walks: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminPageIntro
          description="Import a GPX file once and reuse the route on any walk. Members see the map and the distance on the walk page."
          title="Walking routes"
        />
        <Button asChild>
          <Link href="/admin/routes/new">
            <Plus className="size-4" />
            New route
          </Link>
        </Button>
      </div>

      {routes.length === 0 ? (
        <EmptyState
          description="Import a GPX file to add your first route. It takes a couple of minutes and you only do it once — every future walk on that path can reuse it."
          icon={RouteIcon}
          title="No routes yet"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => {
            const points = parseRoutePoints(route.points);
            return (
              <Card className="gap-3" key={route.id}>
                <CardHeader className="gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      <Link className="hover:underline" href={`/admin/routes/${route.id}`}>
                        {route.name}
                      </Link>
                    </CardTitle>
                    {route.difficulty ? (
                      <Badge variant="secondary">{difficultyLabel(route.difficulty)}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatMiles(route.distanceMetres)}
                    {" · "}
                    {points.length} points
                    {route.elevationGainMetres != null
                      ? ` · ${Math.round(route.elevationGainMetres)} m ascent`
                      : null}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {route.notes ? <p className="text-sm">{route.notes}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {route._count.walks === 0
                      ? "Not used on a walk yet"
                      : `Used on ${route._count.walks} ${route._count.walks === 1 ? "walk" : "walks"}`}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/routes/${route.id}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
