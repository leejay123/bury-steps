import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { formatTime } from "@/lib/dates";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";
import { upcomingListLookbackFrom, walkStatus } from "@/lib/walk-window";

/** One upcoming walk's two lines, as the walks table writes them (walk-table-card.tsx). */
export type UpcomingWalkLine = { title: string; detail: string };

/**
 * The next upcoming walks' names and "10:15 · Meeting place" lines, the same for everyone:
 * a shared saved copy for the walks tables' placeholders, which lay grey bars over these
 * words so each row wraps to the same height as the real one (a long name takes two lines
 * on a phone). Refreshed when a walk changes (the Walks pages and the homepage tag) and
 * every few minutes, as walks start and finish.
 */
export async function getUpcomingWalkLines(): Promise<UpcomingWalkLine[]> {
  "use cache: remote";
  cacheTag(HOMEPAGE_CACHE_TAG);
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  try {
    const walks = await prisma.walk.findMany({
      where: { startsAt: { gte: upcomingListLookbackFrom() }, cancelledAt: null },
      orderBy: { startsAt: "asc" },
      take: 30,
      select: { title: true, location: true, startsAt: true, durationMins: true, endedAt: true, cancelledAt: true },
    });
    return walks
      .filter((walk) => walkStatus(walk) !== "completed")
      .slice(0, 10)
      .map((walk) => ({
        title: walk.title,
        detail: `${formatTime(walk.startsAt)}${walk.location ? ` · ${walk.location}` : ""}`,
      }));
  } catch {
    return [];
  }
}
