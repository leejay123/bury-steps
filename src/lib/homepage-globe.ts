import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";

/** Bury town centre, where most of the globe hero's lines start. */
export const BURY: [number, number] = [53.593, -2.298];

/** The live numbers beside the globe hero. */
export type HomepageGlobeData = {
  upcomingWalks: number;
  members: number;
  walksThisYear: number;
  /** The year "walks so far in …" refers to. */
  year: number;
};

/**
 * Worked out from today's date, so it's a saved copy kept 15 minutes (one
 * shared by every server) rather than read during the page's build: the
 * ready-made homepage can't depend on the current time, and reading it
 * there made rebuilding the homepage fail once the globe hero was chosen.
 */
export async function getHomepageGlobeData(): Promise<HomepageGlobeData> {
  "use cache: remote";
  cacheTag(HOMEPAGE_CACHE_TAG);
  cacheLife({ revalidate: 15 * 60 });
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const [upcomingWalks, members, walksThisYear] = await Promise.all([
    prisma.walk.count({ where: { cancelledAt: null, startsAt: { gte: now } } }),
    prisma.user.count(),
    prisma.walk.count({ where: { cancelledAt: null, startsAt: { gte: startOfYear, lt: now } } }),
  ]);
  return { upcomingWalks, members, walksThisYear, year: now.getFullYear() };
}
