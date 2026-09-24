import { prisma } from "@/lib/db";
import { memberDisplayName } from "@/lib/auth";
import { walkStatus } from "@/lib/walk-window";

/** Cap for the member-facing "All walks" tab — a weekly walk for a decade
 * is ~520, so this comfortably covers any realistic history. */
const ALL_WALKS_LIMIT = 500;
/** Future-dated cancellations sort ahead of past completed walks by
 * startsAt desc; keep a small dedicated window so heavy cancel/reschedule
 * cannot crowd completed history out of the 500-row take. */
const FUTURE_CANCELLED_LIMIT = 50;

export type AllWalksRow = {
  id: string;
  token: string;
  slug: string | null;
  title: string;
  location: string | null;
  startsAt: Date;
  durationMins: number;
  /** Set once an organiser ends the walk early — see endWalkEarly. */
  endedAt: Date | null;
  cancelledAt: Date | null;
  attendanceCount: number;
};

const walkSelect = {
  id: true,
  token: true,
  slug: true,
  title: true,
  location: true,
  startsAt: true,
  durationMins: true,
  endedAt: true,
  cancelledAt: true,
  _count: { select: { attendances: true } },
} as const;

type WalkCandidate = {
  id: string;
  token: string;
  slug: string | null;
  title: string;
  location: string | null;
  startsAt: Date;
  durationMins: number;
  endedAt: Date | null;
  cancelledAt: Date | null;
  _count: { attendances: number };
};

/**
 * Every completed or cancelled walk site-wide, newest first —
 * title/date/location only (plus cancelledAt, so the list can label and
 * filter cancelled ones). Deliberately excludes anything still upcoming,
 * starting soon, or in progress — those live in the Upcoming tab instead.
 * Attendee names are deliberately not included here: WalkLivePanel already
 * only reveals who attended to someone who was on that walk themselves,
 * and this list must not bypass that by exposing names some other way.
 */
export async function getAllWalksSiteWide(): Promise<AllWalksRow[]> {
  const now = new Date();
  // Split the query so future cancellations (high startsAt) cannot fill the
  // take window and push older completed walks off All walks.
  const [pastOrStarted, futureCancelled] = await Promise.all([
    prisma.walk.findMany({
      where: {
        OR: [
          { cancelledAt: { not: null }, startsAt: { lte: now } },
          { cancelledAt: null, startsAt: { lte: now } },
        ],
      },
      orderBy: { startsAt: "desc" },
      take: ALL_WALKS_LIMIT,
      select: walkSelect,
    }),
    prisma.walk.findMany({
      where: { cancelledAt: { not: null }, startsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      take: FUTURE_CANCELLED_LIMIT,
      select: walkSelect,
    }),
  ]);

  const byId = new Map<string, WalkCandidate>();
  for (const walk of [...pastOrStarted, ...futureCancelled]) {
    byId.set(walk.id, walk);
  }

  return [...byId.values()]
    .filter((walk) => {
      const status = walkStatus(walk, now);
      return status === "completed" || status === "cancelled";
    })
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    .slice(0, ALL_WALKS_LIMIT)
    .map((walk) => ({
      id: walk.id,
      token: walk.token,
      slug: walk.slug,
      title: walk.title,
      location: walk.location,
      startsAt: walk.startsAt,
      durationMins: walk.durationMins,
      endedAt: walk.endedAt,
      cancelledAt: walk.cancelledAt,
      attendanceCount: walk._count.attendances,
    }));
}

/** Everyone who clocked into a walk, whether or not they've since clocked
 * out — used to tag "who was involved" on an accident report, which can be
 * written up after the walk (and thus after everyone's clocked out). */
export async function getWalkAttendeesForReport(
  walkId: string,
): Promise<{ id: string; name: string }[]> {
  const rows = await prisma.attendance.findMany({
    where: { walkId },
    orderBy: { clockedInAt: "asc" },
    select: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return rows.map((row) => ({ id: row.user.id, name: memberDisplayName(row.user) }));
}

export async function getWalkMemberNames(walkId: string): Promise<string[]> {
  const rows = await prisma.attendance.findMany({
    where: { walkId, clockedOutAt: null },
    orderBy: { clockedInAt: "asc" },
    select: {
      user: { select: { firstName: true, lastName: true } },
    },
  });

  return rows.map((row) => memberDisplayName(row.user));
}

/** Headcounts only — used on the Walks cards so a busy walk does not ship every name. */
export async function getWalkMemberCountsByWalkIds(
  walkIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>(walkIds.map((id) => [id, 0]));
  if (walkIds.length === 0) return counts;

  const rows = await prisma.attendance.groupBy({
    by: ["walkId"],
    where: { walkId: { in: walkIds }, clockedOutAt: null },
    _count: { _all: true },
  });

  for (const row of rows) {
    counts.set(row.walkId, row._count._all);
  }

  return counts;
}
