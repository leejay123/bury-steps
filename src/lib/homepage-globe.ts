import { prisma } from "@/lib/db";

/** Bury town centre, where most of the globe hero's lines start. */
export const BURY: [number, number] = [53.593, -2.298];

/** The live numbers beside the globe hero. */
export type HomepageGlobeData = {
  upcomingWalks: number;
  members: number;
  walksThisYear: number;
};

export async function getHomepageGlobeData(now = new Date()): Promise<HomepageGlobeData> {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const [upcomingWalks, members, walksThisYear] = await Promise.all([
    prisma.walk.count({ where: { cancelledAt: null, startsAt: { gte: now } } }),
    prisma.user.count(),
    prisma.walk.count({ where: { cancelledAt: null, startsAt: { gte: startOfYear, lt: now } } }),
  ]);
  return { upcomingWalks, members, walksThisYear };
}
