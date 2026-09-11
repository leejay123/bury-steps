import Link from "next/link";
import { redirect } from "next/navigation";
import { Footprints } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { windowState, walkStatus, upcomingListLookbackFrom } from "@/lib/walk-window";
import { walkSharePath } from "@/lib/walk-slug";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberWelcomeDialog } from "@/components/member-welcome-dialog";
import { getAllWalksSiteWide, getWalkMemberCountsByWalkIds } from "@/lib/walk-members";
import { UpcomingWalkCards } from "./upcoming-walk-cards";
import { AllWalksList } from "./all-walks-list";
import { RecentWalksCarousel } from "./recent-walks-carousel";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const now = new Date();
  const upcomingFrom = upcomingListLookbackFrom(now);

  const [walkCandidates, historyCandidates, totalAttendanceCount] = await Promise.all([
    prisma.walk.findMany({
      // Cancelled walks never belong here — Upcoming is only ever upcoming,
      // starting soon, or in progress. A cancelled walk shows in All walks
      // instead, alongside completed ones, regardless of its original date.
      where: { startsAt: { gte: upcomingFrom }, cancelledAt: null },
      orderBy: { startsAt: "asc" },
      take: 100,
      select: {
        id: true,
        token: true,
        slug: true,
        title: true,
        description: true,
        location: true,
        startsAt: true,
        durationMins: true,
        endedAt: true,
        attendances: {
          where: { userId: user.id, clockedOutAt: null },
          select: { clockedInAt: true },
        },
      },
    }),
    prisma.attendance.findMany({
      // A cancelled walk belongs in All walks, not this "recent walks"
      // glance — it never actually happened. Reopening a walk clears
      // cancelledAt, so it reappears here on its own.
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
            slug: true,
            startsAt: true,
            durationMins: true,
            endedAt: true,
            cancelledAt: true,
          },
        },
      },
    }),
    prisma.attendance.count({ where: { userId: user.id } }),
  ]);

  const walks = walkCandidates.filter(
    (walk) => windowState(walk.startsAt, walk.durationMins, now, walk.endedAt) !== "closed",
  );

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
  const [memberCountsByWalk, allWalks] = await Promise.all([
    getWalkMemberCountsByWalkIds(clockedWalkIds),
    getAllWalksSiteWide(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <MemberWelcomeDialog
        firstName={user.firstName}
        hasNoWalks={totalAttendanceCount === 0}
        userId={user.id}
      />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold tracking-tight">Walks</h1>
        <p className="text-sm text-muted-foreground">
          Member since {formatDate(user.createdAt)} · {formatMembershipAge(user.createdAt)}. Upcoming
          walks you can clock in to. Cancelled walks are in All walks, alongside completed ones.
          Past walks you attended are in History.
        </p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({walks.length})</TabsTrigger>
          <TabsTrigger value="all-walks">All walks ({allWalks.length})</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4" value="upcoming">
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
                  slug: walk.slug,
                  title: walk.title,
                  description: walk.description,
                  location: walk.location,
                  startsAt: walk.startsAt.toISOString(),
                  durationMins: walk.durationMins,
                  clockedInAt: clockedIn ? clockedIn.clockedInAt.toISOString() : null,
                  endedAt: walk.endedAt?.toISOString() ?? null,
                  state: windowState(walk.startsAt, walk.durationMins, now, walk.endedAt),
                  memberCount: memberCountsByWalk.get(walk.id) ?? 0,
                };
              })}
            />
          )}
        </TabsContent>
        <TabsContent className="mt-4" value="all-walks">
          <AllWalksList
            rows={allWalks.map((walk) => ({
              id: walk.id,
              href: walkSharePath(walk),
              title: walk.title,
              location: walk.location,
              startsAt: walk.startsAt.toISOString(),
              durationMins: walk.durationMins,
              endedAt: walk.endedAt?.toISOString() ?? null,
              cancelledAt: walk.cancelledAt?.toISOString() ?? null,
              attendanceCount: walk.attendanceCount,
            }))}
          />
        </TabsContent>
      </Tabs>

      {recentWalks.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Your recent walks</h2>
            <Button asChild size="sm" variant="ghost">
              <Link href="/history">
                {historyReadyCount === 1 ? "View history" : `View all ${historyReadyCount}`}
              </Link>
            </Button>
          </div>
          <RecentWalksCarousel
            walks={recentWalks.map((attendance) => ({
              id: attendance.id,
              token: attendance.walk.token,
              slug: attendance.walk.slug,
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
