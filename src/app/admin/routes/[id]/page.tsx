import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseRoutePoints } from "@/lib/route-geometry";
import { parseElevationProfile } from "@/lib/gpx";
import { AdminPageIntro } from "../../admin-page-intro";
import { RouteForm } from "../route-form";
import { DeleteRouteButton } from "./delete-route-button";

export const dynamic = "force-dynamic";

export default async function EditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const route = await prisma.walkRoute.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      notes: true,
      points: true,
      elevationGainMetres: true,
      elevationLossMetres: true,
      maxElevationMetres: true,
      minElevationMetres: true,
      elevationProfile: true,
      difficulty: true,
      _count: { select: { walks: true } },
    },
  });
  if (!route) notFound();

  const points = parseRoutePoints(route.points);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminPageIntro
          description={
            route._count.walks === 0
              ? "Not used on a walk yet."
              : `Used on ${route._count.walks} ${route._count.walks === 1 ? "walk" : "walks"}. Changes show on all of them.`
          }
          title={route.name}
        />
        <DeleteRouteButton id={route.id} name={route.name} walkCount={route._count.walks} />
      </div>

      <RouteForm
        route={{
          id: route.id,
          name: route.name,
          notes: route.notes,
          points,
          elevationGainMetres: route.elevationGainMetres,
          elevationLossMetres: route.elevationLossMetres,
          maxElevationMetres: route.maxElevationMetres,
          minElevationMetres: route.minElevationMetres,
          elevationProfile: parseElevationProfile(route.elevationProfile, points.length),
          difficulty: route.difficulty,
        }}
        snappingAvailable={Boolean(process.env.OPENROUTESERVICE_API_KEY)}
      />
    </div>
  );
}
