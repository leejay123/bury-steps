import { prisma } from "@/lib/db";
import { memberDisplayName } from "@/lib/auth";

export async function getWalkMemberNames(walkId: string): Promise<string[]> {
  const rows = await prisma.attendance.findMany({
    where: { walkId },
    orderBy: { clockedInAt: "asc" },
    select: {
      user: { select: { firstName: true, lastName: true } },
    },
  });

  return rows.map((row) => memberDisplayName(row.user));
}

export async function getWalkMemberNamesByWalkIds(
  walkIds: string[],
): Promise<Map<string, string[]>> {
  const namesByWalk = new Map<string, string[]>(walkIds.map((id) => [id, []]));
  if (walkIds.length === 0) return namesByWalk;

  const rows = await prisma.attendance.findMany({
    where: { walkId: { in: walkIds } },
    orderBy: { clockedInAt: "asc" },
    select: {
      walkId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  for (const row of rows) {
    namesByWalk.get(row.walkId)?.push(memberDisplayName(row.user));
  }

  return namesByWalk;
}
