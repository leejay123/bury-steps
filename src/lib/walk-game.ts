import { londonMonthKey, londonWeekStartKey, londonYear } from "./dates";
import { walkStatus } from "./walk-window";

export const COMEBACK_MISSED_WEEKS = 3;
export const ALL_MONTH_MIN_WALKS = 2;
export const STREAK_BADGE_WEEKS = 2;
export const MAX_MONTHLY_CLOCK_IN_GOAL = 9999;

export type WalkGameWalk = {
  id: string;
  startsAt: Date;
  durationMins: number;
  cancelledAt: Date | null;
};

export type WalkGameAttendance = {
  walkId: string;
  userId: string;
  clockedOutAt: Date | null;
  firstName: string | null;
  lastName: string | null;
};

export type WalkGameBadge = {
  id: string;
  label: string;
};

export type WalkGamePerson = {
  userId: string;
  name: string;
  isViewer: boolean;
  monthCount: number;
};

export type WalkGameView = {
  viewer: {
    monthCount: number;
    yearCount: number;
    totalCount: number;
    streakWeeks: number;
    badges: WalkGameBadge[];
  };
  together: { goal: number; count: number } | null;
  cup: { monthLabel: string; names: string[] } | null;
  board: WalkGamePerson[];
};

type Qualifying = {
  walk: WalkGameWalk;
  weekKey: string;
  monthKey: string;
  year: number;
};

function isQualifyingWalk(walk: WalkGameWalk, now: Date): boolean {
  return walkStatus(walk, now) === "completed";
}

function shiftWeekKey(key: string, weeks: number): string {
  const [year, month, day] = key.split("-").map(Number);
  return londonWeekStartKey(new Date(Date.UTC(year, month - 1, day + weeks * 7, 12, 0, 0)));
}

function firstNameOf(row: { firstName: string | null; lastName: string | null }): string {
  const first = row.firstName?.trim();
  if (first) return first;
  const last = row.lastName?.trim();
  if (last) return "Member";
  return "Member";
}

function lastInitial(row: { lastName: string | null }): string | null {
  const last = row.lastName?.trim();
  if (!last) return null;
  return last[0]?.toUpperCase() ?? null;
}

function displayNames(
  people: Map<string, { firstName: string | null; lastName: string | null }>,
): Map<string, string> {
  const firsts = new Map<string, string[]>();
  for (const [userId, person] of people) {
    const first = firstNameOf(person);
    const list = firsts.get(first) ?? [];
    list.push(userId);
    firsts.set(first, list);
  }

  const names = new Map<string, string>();
  for (const [userId, person] of people) {
    const first = firstNameOf(person);
    const clash = (firsts.get(first) ?? []).length > 1;
    const initial = lastInitial(person);
    names.set(userId, clash && initial ? `${first} ${initial}` : first);
  }
  return names;
}

function currentStreak(userWeeks: Set<string>, walkWeeks: Set<string>, now: Date): number {
  if (walkWeeks.size === 0) return 0;

  let week = londonWeekStartKey(now);
  let streak = 0;
  const oldest = [...walkWeeks].sort()[0];

  while (week >= oldest) {
    if (!walkWeeks.has(week)) {
      week = shiftWeekKey(week, -1);
      continue;
    }
    if (!userWeeks.has(week)) break;
    streak += 1;
    week = shiftWeekKey(week, -1);
  }

  return streak;
}

function hasComeback(attendedWeeks: string[], walkWeeksSorted: string[]): boolean {
  if (attendedWeeks.length < 2) return false;
  const walkIndex = new Map(walkWeeksSorted.map((key, index) => [key, index]));

  for (let i = 1; i < attendedWeeks.length; i++) {
    const prev = walkIndex.get(attendedWeeks[i - 1]);
    const next = walkIndex.get(attendedWeeks[i]);
    if (prev == null || next == null) continue;
    if (next - prev - 1 >= COMEBACK_MISSED_WEEKS) return true;
  }
  return false;
}

function attendedEveryWalkInAMonth(
  userWalkIds: Set<string>,
  qualifying: Qualifying[],
): boolean {
  const byMonth = new Map<string, Qualifying[]>();
  for (const item of qualifying) {
    const list = byMonth.get(item.monthKey) ?? [];
    list.push(item);
    byMonth.set(item.monthKey, list);
  }

  for (const walks of byMonth.values()) {
    if (walks.length < ALL_MONTH_MIN_WALKS) continue;
    if (walks.every((item) => userWalkIds.has(item.walk.id))) return true;
  }
  return false;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

function viewerBadges(input: {
  totalCount: number;
  streakWeeks: number;
  stayed: boolean;
  allMonth: boolean;
  comeback: boolean;
}): WalkGameBadge[] {
  const badges: WalkGameBadge[] = [];
  if (input.totalCount >= 1) badges.push({ id: "first-walk", label: "First walk" });
  if (input.totalCount >= 5) badges.push({ id: "walks-5", label: "5 walks" });
  if (input.totalCount >= 10) badges.push({ id: "walks-10", label: "10 walks" });
  if (input.totalCount >= 25) badges.push({ id: "walks-25", label: "25 walks" });
  if (input.stayed) badges.push({ id: "stayed", label: "Stayed for the whole walk" });
  if (input.allMonth) badges.push({ id: "all-month", label: "Every walk in a month" });
  if (input.streakWeeks >= STREAK_BADGE_WEEKS) {
    badges.push({
      id: "streak",
      label: `${input.streakWeeks}-week streak`,
    });
  }
  if (input.comeback) badges.push({ id: "comeback", label: "Comeback" });
  return badges;
}

export function buildWalkGame({
  walks,
  attendances,
  viewerId,
  now,
  monthlyClockInGoal,
}: {
  walks: WalkGameWalk[];
  attendances: WalkGameAttendance[];
  viewerId: string;
  now: Date;
  monthlyClockInGoal: number | null;
}): WalkGameView {
  const qualifying = walks
    .filter((walk) => isQualifyingWalk(walk, now))
    .map((walk) => ({
      walk,
      weekKey: londonWeekStartKey(walk.startsAt),
      monthKey: londonMonthKey(walk.startsAt),
      year: londonYear(walk.startsAt),
    }));
  const qualifyingById = new Map(qualifying.map((item) => [item.walk.id, item]));
  const thisMonth = londonMonthKey(now);
  const thisYear = londonYear(now);

  const people = new Map<string, { firstName: string | null; lastName: string | null }>();
  const rows: { userId: string; item: Qualifying; clockedOutAt: Date | null }[] = [];

  for (const attendance of attendances) {
    const item = qualifyingById.get(attendance.walkId);
    if (!item) continue;
    people.set(attendance.userId, {
      firstName: attendance.firstName,
      lastName: attendance.lastName,
    });
    rows.push({ userId: attendance.userId, item, clockedOutAt: attendance.clockedOutAt });
  }

  const names = displayNames(people);
  const walkWeeks = new Set(qualifying.map((item) => item.weekKey));
  const walkWeeksSorted = [...walkWeeks].sort();

  const byUser = new Map<
    string,
    { months: number; years: number; total: number; weeks: Set<string>; walkIds: Set<string>; stayed: boolean }
  >();

  for (const row of rows) {
    const current = byUser.get(row.userId) ?? {
      months: 0,
      years: 0,
      total: 0,
      weeks: new Set<string>(),
      walkIds: new Set<string>(),
      stayed: false,
    };
    current.total += 1;
    current.walkIds.add(row.item.walk.id);
    current.weeks.add(row.item.weekKey);
    if (row.item.monthKey === thisMonth) current.months += 1;
    if (row.item.year === thisYear) current.years += 1;
    if (!row.clockedOutAt) current.stayed = true;
    byUser.set(row.userId, current);
  }

  const viewerStats = byUser.get(viewerId) ?? {
    months: 0,
    years: 0,
    total: 0,
    weeks: new Set<string>(),
    walkIds: new Set<string>(),
    stayed: false,
  };

  const attendedWeeks = [...viewerStats.weeks].sort();
  const streakWeeks = currentStreak(viewerStats.weeks, walkWeeks, now);

  const board = [...byUser.entries()]
    .map(([userId, stats]) => ({
      userId,
      name: names.get(userId) ?? "Member",
      isViewer: userId === viewerId,
      monthCount: stats.months,
    }))
    .filter((row) => row.monthCount > 0)
    .sort((a, b) => b.monthCount - a.monthCount || a.name.localeCompare(b.name, "en-GB"));

  const togetherCount = board.reduce((sum, row) => sum + row.monthCount, 0);
  const goal = monthlyClockInGoal && monthlyClockInGoal > 0 ? monthlyClockInGoal : null;

  const top = board[0]?.monthCount ?? 0;
  const cupNames = board.filter((row) => row.monthCount === top).map((row) => row.name);

  return {
    viewer: {
      monthCount: viewerStats.months,
      yearCount: viewerStats.years,
      totalCount: viewerStats.total,
      streakWeeks,
      badges: viewerBadges({
        totalCount: viewerStats.total,
        streakWeeks,
        stayed: viewerStats.stayed,
        allMonth: attendedEveryWalkInAMonth(viewerStats.walkIds, qualifying),
        comeback: hasComeback(attendedWeeks, walkWeeksSorted),
      }),
    },
    together: goal ? { goal, count: togetherCount } : null,
    cup: top > 0 ? { monthLabel: monthLabel(thisMonth), names: cupNames } : null,
    board,
  };
}
