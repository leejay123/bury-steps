import { prisma } from "@/lib/db";
import { MAX_WALK_DURATION_MINS, OPENS_BEFORE_MS, windowState } from "@/lib/walk-window";
import { walkSharePath } from "@/lib/walk-slug";

/**
 * The walk this member can clock in to right now, if any — for the phone
 * bottom bar's "Clock in" button. Same window as the walk page itself (an
 * hour before the start until the walk ends, see windowState), skipping
 * cancelled walks and ones they've already clocked in to. The soonest
 * start wins if two overlap.
 */
export async function getClockInWalk(userId: string, now = new Date()) {
  const walks = await prisma.walk.findMany({
    where: {
      cancelledAt: null,
      startsAt: {
        gte: new Date(now.getTime() - MAX_WALK_DURATION_MINS * 60_000),
        lte: new Date(now.getTime() + OPENS_BEFORE_MS),
      },
      attendances: { none: { userId } },
    },
    orderBy: { startsAt: "asc" },
    select: { title: true, token: true, slug: true, startsAt: true, durationMins: true, endedAt: true },
    take: 5,
  });
  const walk = walks.find((w) => windowState(w.startsAt, w.durationMins, now, w.endedAt) === "open");
  return walk ? { href: walkSharePath(walk), title: walk.title } : null;
}
