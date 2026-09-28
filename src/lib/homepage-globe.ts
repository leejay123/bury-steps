import { prisma } from "@/lib/db";

/** Bury town centre, where every walk line on the globe starts. */
export const BURY: [number, number] = [53.593, -2.298];

export type GlobePoint = { lat: number; lng: number; label?: string };

export type HomepageGlobeData = {
  points: GlobePoint[];
  upcomingWalks: number;
  members: number;
  walksThisYear: number;
};

export async function getHomepageGlobeData(now = new Date()): Promise<HomepageGlobeData> {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const [placed, upcomingWalks, members, walksThisYear] = await Promise.all([
    prisma.walk.findMany({
      where: { cancelledAt: null, latitude: { not: null }, longitude: { not: null } },
      select: { latitude: true, longitude: true, location: true },
      orderBy: { startsAt: "desc" },
      take: 200,
    }),
    prisma.walk.count({ where: { cancelledAt: null, startsAt: { gte: now } } }),
    prisma.user.count(),
    prisma.walk.count({ where: { cancelledAt: null, startsAt: { gte: startOfYear, lt: now } } }),
  ]);

  // Walks often reuse a meeting point; one dot per spot (to ~1km).
  const seen = new Set<string>();
  const points: GlobePoint[] = [];
  for (const walk of [...placed.map((w) => ({ lat: w.latitude!, lng: w.longitude!, label: placeName(w.location) })), ...PREVIEW_SAMPLE_WALKS]) {
    const key = `${walk.lat.toFixed(2)},${walk.lng.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    points.push(walk);
    if (points.length === 40) break;
  }

  return { points, upcomingWalks, members, walksThisYear };
}

/** "Lido Carpark, Bury, BL9 0AA" → "Lido Carpark": the first part reads best as a tag. */
function placeName(location: string | null) {
  return location?.split(",")[0]?.trim() || undefined;
}

// PREVIEW ONLY — pretend finished walks so the globe can be tried with
// spots far enough apart to see. Never saved to the database (previews
// share the live one). Remove before this goes live.
const PREVIEW_SAMPLE_WALKS: GlobePoint[] = [
  { lat: 54.46, lng: -3.09, label: "Lake District" },
  { lat: 53.07, lng: -4.08, label: "Snowdonia" },
  { lat: 53.35, lng: -1.81, label: "Peak District" },
  { lat: 54.22, lng: -2.1, label: "Yorkshire Dales" },
  { lat: 56.8, lng: -5.0, label: "Ben Nevis" },
  { lat: 55.95, lng: -3.19, label: "Edinburgh" },
];
