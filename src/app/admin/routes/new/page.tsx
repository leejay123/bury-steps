import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminPageIntro } from "../../admin-page-intro";
import { RouteForm } from "../route-form";

export const dynamic = "force-dynamic";

export default async function NewRoutePage() {
  await requireAdmin();

  // Open the map over the group's usual patch rather than the default
  // centre — the most recent walk with a pin is the best guess we have.
  const recent = await prisma.walk.findFirst({
    where: { latitude: { not: null }, longitude: { not: null } },
    orderBy: { startsAt: "desc" },
    select: { latitude: true, longitude: true },
  });

  const startNear =
    recent?.latitude != null && recent?.longitude != null
      ? { lat: recent.latitude, lng: recent.longitude }
      : null;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <AdminPageIntro
        description="Click the map along the path you walk. The distance works itself out as you go."
        title="New route"
      />
      <RouteForm
        snappingAvailable={Boolean(process.env.OPENROUTESERVICE_API_KEY)}
        startNear={startNear}
      />
    </div>
  );
}
