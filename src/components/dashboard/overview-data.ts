import { prisma } from "@/lib/db";
import { walkSharePath } from "@/lib/walk-slug";

/** One figure in the Overview's top row. */
export type OverviewStat = { label: string; value: string; note?: string };
/** One point on the Overview's chart. */
export type OverviewPoint = { label: string; value: number };
/** One row of the upcoming walks table. */
export type OverviewWalk = {
  id: string;
  title: string;
  startsAt: string;
  location: string | null;
  leader: string | null;
  clockedIn: number;
  href: string;
};
/** One line of the side list (notices for members, recent clock-ins for organisers). */
export type OverviewItem = { id: string; title: string; detail: string; at: string; href: string | null };

export type OverviewData = {
  firstName: string;
  organiser: boolean;
  stats: OverviewStat[];
  chartTitle: string;
  chart: OverviewPoint[];
  walks: OverviewWalk[];
  sideTitle: string;
  side: OverviewItem[];
  notices: OverviewItem[];
};

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "Europe/London" });
const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" });

/**
 * Everything the dashboard's Overview shows, from the site's own data: a
 * member's own clock-ins and the walks and notices they can see; organisers
 * also get the group's figures and recent clock-ins.
 */
export async function loadOverview(user: {
  id: string;
  firstName: string | null;
  role: string;
}): Promise<OverviewData> {
  const now = new Date();
  const organiser = user.role === "ADMIN";
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const sixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const twelveWeeks = new Date(now.getTime() - 12 * 7 * 86_400_000);
  const ninetyDays = new Date(now.getTime() - 90 * 86_400_000);

  const [myMonth, myYear, myTotal, myRecent, upcoming, notices] = await Promise.all([
    prisma.attendance.count({ where: { userId: user.id, clockedInAt: { gte: monthStart } } }),
    prisma.attendance.count({ where: { userId: user.id, clockedInAt: { gte: yearStart } } }),
    prisma.attendance.count({ where: { userId: user.id } }),
    prisma.attendance.findMany({
      where: { userId: user.id, clockedInAt: { gte: sixMonths } },
      select: { clockedInAt: true },
    }),
    prisma.walk.findMany({
      where: { cancelledAt: null, startsAt: { gte: new Date(now.getTime() - 6 * 3_600_000) } },
      orderBy: { startsAt: "asc" },
      take: 6,
      select: {
        id: true,
        title: true,
        startsAt: true,
        location: true,
        walkLeader: true,
        slug: true,
        token: true,
        _count: { select: { attendances: true } },
      },
    }),
    prisma.siteNotice.findMany({
      where: { enabled: true, audience: "MEMBERS" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, body: true, kind: true, slug: true, createdAt: true },
    }),
  ]);

  const walks: OverviewWalk[] = upcoming.map((walk) => ({
    id: walk.id,
    title: walk.title,
    startsAt: walk.startsAt.toISOString(),
    location: walk.location,
    leader: walk.walkLeader,
    clockedIn: walk._count.attendances,
    href: organiser ? `/admin/walks/${walk.id}` : walkSharePath(walk),
  }));
  const noticeItems: OverviewItem[] = notices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    detail: notice.body.slice(0, 120),
    at: DAY.format(notice.createdAt),
    href: notice.kind === "PAGE" && notice.slug ? `/notices/${notice.slug}` : "/notices",
  }));
  const next = walks.find((walk) => new Date(walk.startsAt) >= now) ?? walks[0];

  if (!organiser) {
    // Your clock-ins per month, the last six months.
    const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
    const chart = months.map((month) => ({
      label: MONTH.format(month),
      value: myRecent.filter(
        (row) =>
          row.clockedInAt.getFullYear() === month.getFullYear() && row.clockedInAt.getMonth() === month.getMonth(),
      ).length,
    }));
    return {
      firstName: user.firstName?.trim() || "there",
      organiser,
      stats: [
        { label: "Your walks this month", value: String(myMonth) },
        { label: "Your walks this year", value: String(myYear) },
        { label: "All your walks", value: String(myTotal) },
        { label: "Next walk", value: next ? DAY.format(new Date(next.startsAt)) : "None yet", note: next?.title },
      ],
      chartTitle: "Your clock-ins, last six months",
      chart,
      walks,
      sideTitle: "Latest notices",
      side: noticeItems,
      notices: noticeItems,
    };
  }

  const [groupMonth, members, active, weekly, recent] = await Promise.all([
    prisma.attendance.count({ where: { clockedInAt: { gte: monthStart } } }),
    prisma.user.count(),
    prisma.attendance.groupBy({ by: ["userId"], where: { clockedInAt: { gte: ninetyDays } } }),
    prisma.attendance.findMany({ where: { clockedInAt: { gte: twelveWeeks } }, select: { clockedInAt: true } }),
    prisma.attendance.findMany({
      orderBy: { clockedInAt: "desc" },
      take: 6,
      select: {
        id: true,
        clockedInAt: true,
        user: { select: { firstName: true, lastName: true } },
        walk: { select: { id: true, title: true } },
      },
    }),
  ]);
  // The group's clock-ins per week, the last twelve weeks.
  const chart = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(twelveWeeks.getTime() + i * 7 * 86_400_000);
    const end = new Date(start.getTime() + 7 * 86_400_000);
    return {
      label: DAY.format(start),
      value: weekly.filter((row) => row.clockedInAt >= start && row.clockedInAt < end).length,
    };
  });
  return {
    firstName: user.firstName?.trim() || "there",
    organiser,
    stats: [
      { label: "Upcoming walks", value: String(walks.filter((walk) => new Date(walk.startsAt) >= now).length) },
      { label: "Clock-ins this month", value: String(groupMonth) },
      { label: "Active members (90 days)", value: String(active.length) },
      { label: "Members", value: String(members) },
    ],
    chartTitle: "Clock-ins per week, last twelve weeks",
    chart,
    walks,
    sideTitle: "Recent clock-ins",
    side: recent.map((row) => ({
      id: row.id,
      title: [row.user.firstName, row.user.lastName].filter(Boolean).join(" ") || "A member",
      detail: row.walk.title,
      at: DAY.format(row.clockedInAt),
      href: `/admin/walks/${row.walk.id}`,
    })),
    notices: noticeItems,
  };
}
