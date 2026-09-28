import { prisma } from "@/lib/db";

/** Bury town centre, where every walk line on the globe starts. */
export const BURY: [number, number] = [53.593, -2.298];

export type HomepageGlobeData = {
  points: [number, number][];
  upcomingWalks: number;
  members: number;
  walksThisYear: number;
};

export async function getHomepageGlobeData(now = new Date()): Promise<HomepageGlobeData> {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const [placed, upcomingWalks, members, walksThisYear] = await Promise.all([
    prisma.walk.findMany({
      where: { cancelledAt: null, latitude: { not: null }, longitude: { not: null } },
      select: { latitude: true, longitude: true },
      orderBy: { startsAt: "desc" },
      take: 200,
    }),
    prisma.walk.count({ where: { cancelledAt: null, startsAt: { gte: now } } }),
    prisma.user.count(),
    prisma.walk.count({ where: { cancelledAt: null, startsAt: { gte: startOfYear, lt: now } } }),
  ]);

  // Walks often reuse a meeting point; one dot per spot (to ~1km).
  const seen = new Set<string>();
  const points: [number, number][] = [];
  for (const walk of placed) {
    const point: [number, number] = [walk.latitude!, walk.longitude!];
    const key = point.map((n) => n.toFixed(2)).join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    points.push(point);
    if (points.length === 40) break;
  }

  return { points, upcomingWalks, members, walksThisYear };
}
