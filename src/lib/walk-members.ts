import { prisma } from "@/lib/db";
import { memberDisplayName } from "@/lib/auth";
import { walkStatus } from "@/lib/walk-window";

/** Cap for the member-facing "All walks" tab — a weekly walk for a decade
 * is ~520, so this comfortably covers any realistic history. */
const ALL_COMPLETED_WALKS_LIMIT = 500;

export type AllWalksRow = {
  id: string;
  token: string;
  slug: string | null;
  title: string;
  location: string | null;
  startsAt: Date;
  durationMins: number;
  attendanceCount: number;
};

/** Every completed walk site-wide, newest first — title/date/location only.
 * Attendee names are deliberately not included here: WalkLivePanel already
 * only reveals who attended to someone who was on that walk themselves,
 * and this list must not bypass that by exposing names some other way. */
export async function getAllCompletedWalks(): Promise<AllWalksRow[]> {
  const candidates = await prisma.walk.findMany({
    where: { cancelledAt: null },
    orderBy: { startsAt: "desc" },
    take: ALL_COMPLETED_WALKS_LIMIT,
    select: {
      id: true,
      token: true,
      slug: true,
      title: true,
      location: true,
      startsAt: true,
      durationMins: true,
      cancelledAt: true,
      _count: { select: { attendances: true } },
    },
  });

  return candidates
    .filter((walk) => walkStatus(walk) === "completed")
    .map((walk) => ({
      id: walk.id,
      token: walk.token,
      slug: walk.slug,
      title: walk.title,
      location: walk.location,
      startsAt: walk.startsAt,
      durationMins: walk.durationMins,
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
