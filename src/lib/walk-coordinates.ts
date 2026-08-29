import { prisma } from "@/lib/db";
import { geocodeLocation, type GeoPoint } from "@/lib/geocode";

/** Use stored coordinates, or look the meeting point up once and save it. */
export async function ensureWalkPoint(walk: {
  id: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
}): Promise<GeoPoint | null> {
  if (walk.latitude != null && walk.longitude != null) {
    return { lat: walk.latitude, lng: walk.longitude };
  }
  if (!walk.location) return null;

  const point = await geocodeLocation(walk.location);
  if (!point) return null;

  try {
    await prisma.walk.update({
      where: { id: walk.id },
      data: { latitude: point.lat, longitude: point.lng },
    });
  } catch {
    // The map can still render for this request even if the save fails.
  }
  return point;
}
