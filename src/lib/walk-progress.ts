import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { buildWalkGame, type WalkGameView } from "@/lib/walk-game";

export async function loadWalkGame(viewerId: string, now = new Date()): Promise<WalkGameView> {
  const [walks, setting] = await Promise.all([
    prisma.walk.findMany({
      where: { cancelledAt: null, startsAt: { lt: now } },
      select: {
        id: true,
        startsAt: true,
        durationMins: true,
        cancelledAt: true,
        attendances: {
          select: {
            userId: true,
            clockedOutAt: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { monthlyClockInGoal: true },
    }),
  ]);

  return buildWalkGame({
    now,
    viewerId,
    monthlyClockInGoal: setting?.monthlyClockInGoal ?? null,
    walks,
    attendances: walks.flatMap((walk) =>
      walk.attendances.map((row) => ({
        walkId: walk.id,
        userId: row.userId,
        clockedOutAt: row.clockedOutAt,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
      })),
    ),
  });
}

export async function getMonthlyClockInGoal(): Promise<number | null> {
  const row = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { monthlyClockInGoal: true },
  });
  return row?.monthlyClockInGoal ?? null;
}
