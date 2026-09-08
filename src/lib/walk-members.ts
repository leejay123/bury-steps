import { prisma } from "@/lib/db";
import { memberDisplayName } from "@/lib/auth";

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
