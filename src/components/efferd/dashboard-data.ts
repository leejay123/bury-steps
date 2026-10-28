import { prisma } from "@/lib/db";
import { walkSharePath } from "@/lib/walk-slug";

/** One figure in a dashboard's top row, with its change against the period before. */
export type DashStat = { label: string; value: string; delta: number; hint: string };
/** One week: its first day (YYYY-MM-DD), your clock-ins, everyone else's, and both. */
export type DashWeek = { date: string; you: number; others: number; total: number };
/** One day (YYYY-MM-DD) and the group's clock-ins that day. */
export type DashDay = { date: string; clockIns: number };
/** A walk in a table or list. */
export type DashWalk = {
  id: string;
  title: string;
  startsAt: string;
  leader: string | null;
  location: string | null;
  walkers: number;
  href: string;
};
/** One line of the activity lists. */
export type DashActivity = { id: string; title: string; time: string; kind: "clock-in" | "notice" | "walk" };
/** A walk leader with walks coming up. */
export type DashLeader = { name: string; walks: number; next: string; href: string };

export type DashboardData = {
  firstName: string;
  organiser: boolean;
  stats: DashStat[];
  weeks: DashWeek[];
  days: DashDay[];
  weekdays: { day: string; clockIns: number }[];
  grades: { category: string; share: number }[];
  perWalk: { day: string; walkers: number }[];
  upcoming: DashWalk[];
  recent: DashWalk[];
  activity: DashActivity[];
  leaders: DashLeader[];
  notice: { title: string; body: string; href: string } | null;
};

const DAY_MS = 86_400_000;
const LONDON_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" });
const LONDON_WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Europe/London" });
const SHORT_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" });
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The London calendar day, as YYYY-MM-DD. */
function dayKey(date: Date) {
  return LONDON_DAY.format(date);
}

/** Percent change from `before` to `now` (100 when it grew from nothing). */
function change(now: number, before: number) {
  if (!before) return now ? 100 : 0;
  return Math.round(((now - before) / before) * 1000) / 10;
}

/** "Today", "Yesterday", "3 days ago", or the date. */
function when(date: Date, now: Date) {
  const days = Math.round((Date.parse(dayKey(now)) - Date.parse(dayKey(date))) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return SHORT_DATE.format(date);
}

function fullName(user: { firstName: string | null; lastName: string | null }) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "A member";
}

/**
 * Everything Efferd's four dashboards show, from the site's own data: the
 * group's clock-ins and walks, the signed-in person's own clock-ins, walk
 * leaders and notices. Organisers also get member figures and who clocked in.
 */
export async function loadDashboard(user: {
  id: string;
  firstName: string | null;
  role: string;
}): Promise<DashboardData> {
  const now = new Date();
  const organiser = user.role === "ADMIN";
  const halfYear = new Date(now.getTime() - 26 * 7 * DAY_MS);
  const yearAgo = new Date(now.getTime() - 365 * DAY_MS);
  const day30 = new Date(now.getTime() - 30 * DAY_MS);
  const day60 = new Date(now.getTime() - 60 * DAY_MS);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearSameDay = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const [attendances, walks, myYear, myLastYear, notices, members] = await Promise.all([
    prisma.attendance.findMany({
      where: { clockedInAt: { gte: halfYear } },
      select: { clockedInAt: true, userId: true },
    }),
    prisma.walk.findMany({
      where: { cancelledAt: null, startsAt: { gte: yearAgo } },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        grade: true,
        location: true,
        walkLeader: true,
        slug: true,
        token: true,
        _count: { select: { attendances: true } },
      },
    }),
    prisma.attendance.count({ where: { userId: user.id, clockedInAt: { gte: yearStart } } }),
    prisma.attendance.count({
      where: { userId: user.id, clockedInAt: { gte: lastYearStart, lt: lastYearSameDay } },
    }),
    prisma.siteNotice.findMany({
      where: { enabled: true, audience: "MEMBERS" },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, title: true, body: true, kind: true, slug: true, createdAt: true },
    }),
    organiser
      ? Promise.all([
          prisma.user.count({ where: { createdAt: { gte: day30 } } }),
          prisma.user.count({ where: { createdAt: { gte: day60, lt: day30 } } }),
          prisma.attendance.findMany({
            orderBy: { clockedInAt: "desc" },
            take: 4,
            select: {
              id: true,
              clockedInAt: true,
              user: { select: { firstName: true, lastName: true } },
              walk: { select: { title: true } },
            },
          }),
        ])
      : null,
  ]);

  const inWindow = (date: Date, from: Date, to: Date) => date >= from && date < to;
  const mine = attendances.filter((row) => row.userId === user.id);
  const count = (rows: { clockedInAt: Date }[], from: Date, to: Date) =>
    rows.filter((row) => inWindow(row.clockedInAt, from, to)).length;
  const held = walks.filter((walk) => walk.startsAt <= now);
  const heldIn = (from: Date, to: Date) => held.filter((walk) => inWindow(walk.startsAt, from, to)).length;
  const href = (walk: { id: string; slug: string | null; token: string }) =>
    organiser ? `/admin/walks/${walk.id}` : walkSharePath(walk);
  const toWalk = (walk: (typeof walks)[number]): DashWalk => ({
    id: walk.id,
    title: walk.title,
    startsAt: walk.startsAt.toISOString(),
    leader: walk.walkLeader,
    location: walk.location,
    walkers: walk._count.attendances,
    href: href(walk),
  });

  const group30 = count(attendances, day30, now);
  const groupPrev = count(attendances, day60, day30);
  const walks30 = heldIn(day30, now);
  const walksPrev = heldIn(day60, day30);
  const hint = "vs prior 30 days";
  let stats: DashStat[];
  if (organiser && members) {
    const active = (from: Date, to: Date) =>
      new Set(attendances.filter((row) => inWindow(row.clockedInAt, from, to)).map((row) => row.userId)).size;
    stats = [
      { label: "Clock-ins (30 days)", value: String(group30), delta: change(group30, groupPrev), hint },
      {
        label: "Active members (30 days)",
        value: String(active(day30, now)),
        delta: change(active(day30, now), active(day60, day30)),
        hint,
      },
      { label: "Walks held (30 days)", value: String(walks30), delta: change(walks30, walksPrev), hint },
      { label: "New members (30 days)", value: String(members[0]), delta: change(members[0], members[1]), hint },
    ];
  } else {
    const my30 = count(mine, day30, now);
    const myPrev = count(mine, day60, day30);
    stats = [
      { label: "Your walks (30 days)", value: String(my30), delta: change(my30, myPrev), hint },
      { label: "Your walks this year", value: String(myYear), delta: change(myYear, myLastYear), hint: "vs this time last year" },
      { label: "Group clock-ins (30 days)", value: String(group30), delta: change(group30, groupPrev), hint },
      { label: "Walks held (30 days)", value: String(walks30), delta: change(walks30, walksPrev), hint },
    ];
  }

  // 26 weeks of seven days each, ending today.
  const weeks: DashWeek[] = Array.from({ length: 26 }, (_, i) => {
    const start = new Date(now.getTime() - (26 - i) * 7 * DAY_MS);
    const end = new Date(start.getTime() + 7 * DAY_MS);
    const you = count(mine, start, end);
    const total = count(attendances, start, end);
    return { date: dayKey(start), you, others: total - you, total };
  });

  // The last 90 days, one row each.
  const perDay = new Map<string, number>();
  for (const row of attendances) perDay.set(dayKey(row.clockedInAt), (perDay.get(dayKey(row.clockedInAt)) ?? 0) + 1);
  const days: DashDay[] = Array.from({ length: 90 }, (_, i) => {
    const date = dayKey(new Date(now.getTime() - (89 - i) * DAY_MS));
    return { date, clockIns: perDay.get(date) ?? 0 };
  });

  const ninety = new Date(now.getTime() - 90 * DAY_MS);
  const weekdays = WEEKDAYS.map((day) => ({
    day,
    clockIns: attendances.filter(
      (row) => row.clockedInAt >= ninety && LONDON_WEEKDAY.format(row.clockedInAt) === day,
    ).length,
  }));

  // Walks held in the last year, by grade.
  const byGrade = new Map<string, number>();
  for (const walk of held) {
    const grade = walk.grade?.trim() || "No grade";
    byGrade.set(grade, (byGrade.get(grade) ?? 0) + 1);
  }
  const grades = [...byGrade]
    .sort((a, b) => b[1] - a[1])
    .map(([category, n]) => ({ category, share: Math.round((n / held.length) * 100) }));

  const perWalk = held.slice(-7).map((walk) => ({ day: SHORT_DATE.format(walk.startsAt), walkers: walk._count.attendances }));

  const upcoming = walks.filter((walk) => walk.startsAt > now).slice(0, 6);

  // Walk leaders of the walks coming up, soonest first.
  const leaders = new Map<string, DashLeader>();
  for (const walk of upcoming) {
    const name = walk.walkLeader?.trim();
    if (!name) continue;
    const known = leaders.get(name);
    if (known) known.walks += 1;
    else leaders.set(name, { name, walks: 1, next: walk.startsAt.toISOString(), href: href(walk) });
  }

  const noticeHref = (notice: (typeof notices)[number]) =>
    notice.kind === "PAGE" && notice.slug ? `/notices/${notice.slug}` : "/notices";
  const activity: DashActivity[] = members
    ? members[2].map((row) => ({
        id: row.id,
        title: `${fullName(row.user)} clocked in to ${row.walk.title}`,
        time: when(row.clockedInAt, now),
        kind: "clock-in" as const,
      }))
    : [
        ...held
          .slice(-4)
          .reverse()
          .map((walk) => ({ id: walk.id, title: `${walk.title} was walked`, at: walk.startsAt, kind: "walk" as const })),
        ...notices.map((notice) => ({ id: notice.id, title: notice.title, at: notice.createdAt, kind: "notice" as const })),
      ]
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .slice(0, 4)
        .map(({ at, ...item }) => ({ ...item, time: when(at, now) }));

  const latest = notices[0];
  return {
    firstName: user.firstName?.trim() || "there",
    organiser,
    stats,
    weeks,
    days,
    weekdays,
    grades,
    perWalk,
    upcoming: upcoming.map(toWalk),
    recent: held.slice(-6).reverse().map(toWalk),
    activity,
    leaders: [...leaders.values()].slice(0, 5),
    notice: latest ? { title: latest.title, body: latest.body.slice(0, 140), href: noticeHref(latest) } : null,
  };
}
