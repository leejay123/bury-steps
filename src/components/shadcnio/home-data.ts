import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";
import { walkSharePath } from "@/lib/walk-slug";
import { effectiveEndsAt } from "@/lib/walk-window";

export type HomeWalk = {
  id: string;
  title: string;
  when: string;
  detail: string;
  href: string;
  /** For the homepage's other walk looks: the start (ISO), and the facts on their own. */
  startsAt?: string;
  distance?: string | null;
  grade?: string | null;
};
export type HomePlace = { name: string; walks: number };

export type ShadcnHomeData = {
  upcomingCount: number;
  members: number;
  walksThisYear: number;
  year: number;
  upcoming: HomeWalk[];
  places: HomePlace[];
  /** The titles of the walks most recently finished, newest first (the hero's signposts). */
  finished: string[];
  /** The next walk, for the bar along the bottom (ISO start time). */
  next: { title: string; startsAt: string; href: string } | null;
};

const WHEN = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Europe/London",
});

/** The first part of a meeting point ("Burrs Country Park, Woodhill Rd" → "Burrs Country Park"). */
function placeName(location: string) {
  return location.split(/[,\n]/)[0]!.trim();
}

/**
 * The figures and walks the shadcn.io-design homepage shows: walks coming
 * up (public share links only), where the group walks, and the totals.
 * Shared by everyone, so it's part of the ready-made page.
 */
export async function getShadcnHomeData(): Promise<ShadcnHomeData> {
  "use cache: remote";
  cacheTag(HOMEPAGE_CACHE_TAG);
  cacheLife({ revalidate: 15 * 60 });
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const [upcoming, upcomingCount, members, walksThisYear, recent, started] = await Promise.all([
    prisma.walk.findMany({
      where: { cancelledAt: null, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 8,
      select: { id: true, title: true, startsAt: true, distance: true, grade: true, slug: true, token: true },
    }),
    prisma.walk.count({ where: { cancelledAt: null, startsAt: { gte: now } } }),
    prisma.user.count(),
    prisma.walk.count({ where: { cancelledAt: null, startsAt: { gte: startOfYear, lt: now } } }),
    prisma.walk.findMany({
      where: { cancelledAt: null, location: { not: null } },
      orderBy: { startsAt: "desc" },
      take: 200,
      select: { location: true },
    }),
    // Walks that have started, newest first: the ones already over name the hero's signposts.
    prisma.walk.findMany({
      where: { cancelledAt: null, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      take: 30,
      select: { title: true, startsAt: true, durationMins: true, endedAt: true },
    }),
  ]);

  const places = new Map<string, number>();
  for (const walk of recent) {
    const name = walk.location ? placeName(walk.location) : "";
    if (name) places.set(name, (places.get(name) ?? 0) + 1);
  }
  const first = upcoming[0];
  return {
    upcomingCount,
    members,
    walksThisYear,
    year: now.getFullYear(),
    upcoming: upcoming.map((walk) => ({
      id: walk.id,
      title: walk.title,
      when: WHEN.format(walk.startsAt),
      detail: [WHEN.format(walk.startsAt), walk.distance, walk.grade].filter(Boolean).join(" · "),
      href: walkSharePath(walk),
      startsAt: walk.startsAt.toISOString(),
      distance: walk.distance,
      grade: walk.grade,
    })),
    places: [...places]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, walks]) => ({ name, walks })),
    finished: started.filter((walk) => effectiveEndsAt(walk).getTime() <= now.getTime()).map((walk) => walk.title),
    next: first ? { title: first.title, startsAt: first.startsAt.toISOString(), href: walkSharePath(first) } : null,
  };
}
