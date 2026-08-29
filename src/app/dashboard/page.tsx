import Link from "next/link";
import { redirect } from "next/navigation";
import { Footprints } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { windowState, walkStatus } from "@/lib/walk-window";
import { CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { MemberWelcomeDialog } from "@/components/member-welcome-dialog";
import { getWalkMemberNamesByWalkIds } from "@/lib/walk-members";
import { UpcomingWalkCards } from "./upcoming-walk-cards";
import { RecentWalksCarousel } from "./recent-walks-carousel";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const now = new Date();
  const upcomingFrom = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const cancelledFrom = new Date(
    now.getTime() - CANCELLED_WALK_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  const [walks, historyCandidates, totalAttendanceCount] = await Promise.all([
    prisma.walk.findMany({
      where: {
        OR: [{ startsAt: { gte: upcomingFrom } }, { cancelledAt: { gte: cancelledFrom } }],
      },
      orderBy: { startsAt: "asc" },
      take: 20,
      select: {
        id: true,
        token: true,
        title: true,
        description: true,
        location: true,
        startsAt: true,
        durationMins: true,
        cancelledAt: true,
        attendances: {
          where: { userId: user.id, clockedOutAt: null },
          select: { clockedInAt: true },
        },
      },
    }),
    prisma.attendance.findMany({
      // A cancelled walk already gets its own "Cancelled" callout in the
      // Upcoming section above (retained for a few days so it isn't a
      // surprise no-show) — once it's history, it shouldn't also linger
      // here in the "recent walks" glance, crowding out walks that
      // actually happened. Reopening a walk clears cancelledAt, so it
      // reappears here on its own.
      //
      // Capped generously rather than to the 3 actually shown: a walk
      // still under way isn't "history" yet either — it hasn't finished —
      // so the most recent clock-in isn't necessarily the most recent
      // *completed* one, and this needs enough candidates to filter down
      // from.
      where: { userId: user.id, walk: { cancelledAt: null } },
      orderBy: { clockedInAt: "desc" },
      take: 30,
      include: {
        walk: {
          select: {
            id: true,
            title: true,
            token: true,
            startsAt: true,
            durationMins: true,
            cancelledAt: true,
          },
        },
      },
    }),
    prisma.attendance.count({ where: { userId: user.id } }),
  ]);

  const completedHistory = historyCandidates.filter(
    (attendance) => walkStatus(attendance.walk) === "completed",
  );
  const recentWalks = completedHistory.slice(0, 3);
  // Any walk still in progress is necessarily among the most recent
  // clock-ins, so it's guaranteed to be in `historyCandidates` — meaning
  // this count of everything else (completed or cancelled) is exact, not
  // an estimate, even though only 30 candidates were fetched.
  const inProgressCount = historyCandidates.length - completedHistory.length;
  const historyReadyCount = totalAttendanceCount - inProgressCount;

  const clockedWalkIds = walks
    .filter((walk) => walk.attendances.length > 0)
    .map((walk) => walk.id);
  const memberNamesByWalk = await getWalkMemberNamesByWalkIds(clockedWalkIds);

  return (
    <div className="flex flex-col gap-8">
      <MemberWelcomeDialog hasNoWalks={totalAttendanceCount === 0} />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Walks</h1>
        <p className="text-sm text-muted-foreground">
          Member since {formatDate(user.createdAt)} · {formatMembershipAge(user.createdAt)}. Upcoming
          walks, including any that have been cancelled. Clock in on the day from here. Past walks
          are in History.
        </p>
      </div>

      {walks.length === 0 ? (
        <EmptyState
          description="Your organiser will post the next one here."
          icon={Footprints}
          title="No walks scheduled yet"
        />
      ) : (
        <UpcomingWalkCards
          walks={walks.map((walk) => {
            const clockedIn = walk.attendances[0];
            return {
              id: walk.id,
              token: walk.token,
              title: walk.title,
              description: walk.description,
              location: walk.location,
              startsAt: walk.startsAt.toISOString(),
              durationMins: walk.durationMins,
              cancelledAt: walk.cancelledAt?.toISOString() ?? null,
              clockedInAt: clockedIn ? clockedIn.clockedInAt.toISOString() : null,
              state: windowState(walk.startsAt, walk.durationMins, now),
              memberNames: memberNamesByWalk.get(walk.id) ?? [],
            };
          })}
        />
      )}

      {recentWalks.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Your recent walks</h2>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/history">
                {historyReadyCount === 1 ? "View history" : `View all ${historyReadyCount}`}
              </Link>
            </Button>
          </div>
          <RecentWalksCarousel
            walks={recentWalks.map((attendance) => ({
              id: attendance.id,
              token: attendance.walk.token,
              title: attendance.walk.title,
              clockedInAt: attendance.clockedInAt.toISOString(),
              clockedOutAt: attendance.clockedOutAt?.toISOString() ?? null,
            }))}
          />
        </section>
      ) : null}
    </div>
  );
}
