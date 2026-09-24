import { prisma } from "@/lib/db";
import { londonMonthKey } from "@/lib/dates";
import { SITE_SETTING_ID } from "@/lib/theme";
import { buildWalkGame, viewerBadges, type WalkGameView } from "@/lib/walk-game";

/** How far back Progress scans for streaks, cups, and the month board. */
const HISTORY_YEARS = 3;

export type WalkGameLoadedData = {
  walks: {
    id: string;
    startsAt: Date;
    durationMins: number;
    cancelledAt: Date | null;
    endedAt: Date | null;
    attendances: {
      userId: string;
      clockedOutAt: Date | null;
      user: { firstName: string | null; lastName: string | null };
    }[];
  }[];
  monthlyClockInGoal: number | null;
  now: Date;
};

/**
 * Shared walk/attendance payload for Progress and the monthly-progress cron.
 * Load once, then build a per-viewer game with {@link walkGameFromLoadedData}
 * so the cron is not O(members × walks).
 *
 * Names are only needed for the current-month board/cup — older rows keep
 * userId + clockedOutAt without hydrating every roster name for 3 years.
 */
export async function loadWalkGameData(now = new Date()): Promise<WalkGameLoadedData> {
  const historyFrom = new Date(now.getTime() - HISTORY_YEARS * 365 * 24 * 60 * 60 * 1000);
  const thisMonth = londonMonthKey(now);

  const [walkRows, setting] = await Promise.all([
    prisma.walk.findMany({
      where: {
        cancelledAt: null,
        startsAt: { gte: historyFrom, lt: now },
      },
      select: {
        id: true,
        startsAt: true,
        durationMins: true,
        cancelledAt: true,
        endedAt: true,
        attendances: {
          select: {
            userId: true,
            clockedOutAt: true,
          },
        },
      },
    }),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { monthlyClockInGoal: true },
    }),
  ]);

  const monthUserIds = new Set<string>();
  for (const walk of walkRows) {
    if (londonMonthKey(walk.startsAt) !== thisMonth) continue;
    for (const row of walk.attendances) monthUserIds.add(row.userId);
  }

  const nameById = new Map<string, { firstName: string | null; lastName: string | null }>();
  if (monthUserIds.size > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: [...monthUserIds] } },
      select: { id: true, firstName: true, lastName: true },
    });
    for (const user of users) {
      nameById.set(user.id, { firstName: user.firstName, lastName: user.lastName });
    }
  }

  const walks = walkRows.map((walk) => ({
    id: walk.id,
    startsAt: walk.startsAt,
    durationMins: walk.durationMins,
    cancelledAt: walk.cancelledAt,
    endedAt: walk.endedAt,
    attendances: walk.attendances.map((row) => ({
      userId: row.userId,
      clockedOutAt: row.clockedOutAt,
      user: nameById.get(row.userId) ?? { firstName: null, lastName: null },
    })),
  }));

  return {
    walks,
    monthlyClockInGoal: setting?.monthlyClockInGoal ?? null,
    now,
  };
}

export function walkGameFromLoadedData(
  viewerId: string,
  data: WalkGameLoadedData,
  lifetimeCount?: number,
): WalkGameView {
  const game = buildWalkGame({
    now: data.now,
    viewerId,
    monthlyClockInGoal: data.monthlyClockInGoal,
    walks: data.walks,
    attendances: data.walks.flatMap((walk) =>
      walk.attendances.map((row) => ({
        walkId: walk.id,
        userId: row.userId,
        clockedOutAt: row.clockedOutAt,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
      })),
    ),
  });

  if (lifetimeCount === undefined) return game;

  const totalCount = Math.max(lifetimeCount, game.viewer.totalCount);
  if (totalCount === game.viewer.totalCount) return game;

  return {
    ...game,
    viewer: {
      ...game.viewer,
      totalCount,
      badges: viewerBadges({
        totalCount,
        streakWeeks: game.viewer.streakWeeks,
        stayed: game.viewer.badges.some((badge) => badge.id === "stayed"),
        allMonth: game.viewer.badges.some((badge) => badge.id === "all-month"),
        comeback: game.viewer.badges.some((badge) => badge.id === "comeback"),
      }),
    },
  };
}

export async function loadWalkGame(viewerId: string, now = new Date()): Promise<WalkGameView> {
  const [data, lifetimeCount] = await Promise.all([
    loadWalkGameData(now),
    prisma.attendance.count({
      where: {
        userId: viewerId,
        walk: { cancelledAt: null, startsAt: { lt: now } },
      },
    }),
  ]);

  return walkGameFromLoadedData(viewerId, data, lifetimeCount);
}

export async function getMonthlyClockInGoal(): Promise<number | null> {
  const row = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { monthlyClockInGoal: true },
  });
  return row?.monthlyClockInGoal ?? null;
}
