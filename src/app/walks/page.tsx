import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Footprints } from "lucide-react";
import { prisma } from "@/lib/db";
import { getOptionalUser, requireUser } from "@/lib/auth";
import { cacheLife } from "next/cache";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { windowState, walkStatus, upcomingListLookbackFrom } from "@/lib/walk-window";
import { walkSharePath } from "@/lib/walk-slug";
import { MemberWalksHold } from "@/components/list-chrome";
import { RememberListCount } from "@/components/remember-list-count";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberWelcomeDialog } from "@/components/member-welcome-dialog";
import { getAllWalksSiteWide, getWalkMemberCountsByWalkIds } from "@/lib/walk-members";
import { UpcomingWalkCards } from "./upcoming-walk-cards";
import { AllWalksList } from "./all-walks-list";
import { RecentWalksCarousel } from "./recent-walks-carousel";
import { LiveUpcomingCount } from "./live-upcoming-count";



/**
 * Fetched ahead from the menu, so Walks opens with your walks already there
 * (getWalksForViewer). The cards work out "Clock in now" and the rest from
 * this device's clock and keep it current, so a copy a few minutes old
 * still shows the right status. See node_modules/next/dist/docs/01-app/
 * 02-guides/optimizing-prefetching.md.
 */
export const prefetch = "partial";

export default function DashboardPage() {
  // Heading and description are the same for everyone, so they're part of
  // the ready-made page; who you are and your walks fill in just after.
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold tracking-tight">Walks</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming walks you can clock in to. Cancelled walks are in All walks, alongside completed
          ones. Past walks you attended are in History.
        </p>
        {/* Its own line, held open while it loads, so arriving doesn't push the list down. */}
        <p className="min-h-5 text-sm text-muted-foreground">
          <Suspense fallback={null}>
            <MemberSince />
          </Suspense>
        </p>
      </div>
      <Suspense fallback={<MemberWalksHold />}>
        <PlaceholderPreview fallback={<MemberWalksHold />}>
          <WalksForMember />
        </PlaceholderPreview>
      </Suspense>
    </div>
  );
}

async function MemberSince() {
  const view = await getWalksForViewer();
  if (!view || view.admin) return null;
  const joined = new Date(view.memberSince);
  return (
    <>
      Member since {formatDate(joined)} · {formatMembershipAge(joined)}.
    </>
  );
}

async function WalksForMember() {
  const view = await getWalksForViewer();
  // Not signed in: requireUser sends them to sign in, as before.
  if (!view) await requireUser();
  // Organisers use the admin Walks tools at /admin — this page is the
  // ordinary member experience (browse walks, clock in), so an admin is
  // always sent there instead.
  if (!view || view.admin) redirect("/admin/walks");
  return <WalksBody view={view} />;
}

/** Every walk that has finished or was cancelled — the same for everyone,
 * so one saved copy shared by all members (a walk finishing shows up
 * within five minutes; any walk change refreshes it at once). */
async function getAllWalksShared() {
  "use cache: remote";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  return getAllWalksSiteWide();
}

/**
 * Your Walks page, as a private saved copy: kept in this browser only for
 * five minutes (never on the server), so the page fetched ahead from the
 * menu can carry it. Clocking in or out, and any walk change, refresh it
 * at once.
 */
async function getWalksForViewer() {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  const user = await getOptionalUser();
  if (!user) return null;
  if (user.role === "ADMIN") return { admin: true as const };
  // Reaching this far means the viewer is a plain member (the owner, like
  // any admin, was already redirected away above) — so a cancelled walk
  // stays non-clickable here. Cancelled walks aren't hidden entirely, just
  // not a link: the row still shows what happened (see AllWalksList).
  const viewerCanOpenCancelledWalk = false;

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
    getAllWalksShared(),
  ]);


  return {
    admin: false as const,
    memberSince: user.createdAt.toISOString(),
    firstName: user.firstName,
    userId: user.id,
    showWelcome: totalAttendanceCount === 0 && user.welcomeSeenAt == null,
    historyReadyCount,
    upcoming: walks.map((walk) => {
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
    }),
    allWalks: allWalks.map((walk) => ({
      id: walk.id,
      href:
        walk.cancelledAt && !viewerCanOpenCancelledWalk
          ? undefined
          : walkSharePath(walk),
      title: walk.title,
      location: walk.location,
      startsAt: new Date(walk.startsAt).toISOString(),
      durationMins: walk.durationMins,
      endedAt: walk.endedAt ? new Date(walk.endedAt).toISOString() : null,
      cancelledAt: walk.cancelledAt ? new Date(walk.cancelledAt).toISOString() : null,
      attendanceCount: walk.attendanceCount,
    })),
    recent: recentWalks.map((attendance) => ({
      id: attendance.id,
      token: attendance.walk.token,
      slug: attendance.walk.slug,
      title: attendance.walk.title,
      clockedInAt: attendance.clockedInAt.toISOString(),
      clockedOutAt: attendance.clockedOutAt?.toISOString() ?? null,
    })),
  };
}

type WalksView = Extract<NonNullable<Awaited<ReturnType<typeof getWalksForViewer>>>, { admin: false }>;

function WalksBody({ view }: { view: WalksView }) {
  const { upcoming, allWalks, recent, historyReadyCount } = view;
  return (
    <>
      <RememberListCount count={upcoming.length} id="member-walks" max={100} />
      <RememberListCount count={allWalks.length} id="member-walks-all" max={500} />
      <RememberListCount count={recent.length} id="member-recent" max={3} />
      <MemberWelcomeDialog firstName={view.firstName} hasNoWalks={view.showWelcome} userId={view.userId} />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming (<LiveUpcomingCount walks={upcoming} />)
          </TabsTrigger>
          <TabsTrigger value="all-walks">All walks ({allWalks.length})</TabsTrigger>
        </TabsList>
        <TabsContent
          className="mt-4 data-[state=inactive]:hidden"
          forceMount
          value="upcoming"
        >
          {upcoming.length === 0 ? (
            <EmptyState
              description="Your organiser will post the next one here."
              icon={Footprints}
              title="No walks scheduled yet"
            />
          ) : (
            <UpcomingWalkCards walks={upcoming} />
          )}
        </TabsContent>
        <TabsContent className="mt-4" value="all-walks">
          <AllWalksList rows={allWalks} />
        </TabsContent>
      </Tabs>

      {recent.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Your recent walks</h2>
            <Button asChild size="sm" variant="ghost">
              <Link href="/history">
                {historyReadyCount === 1 ? "View history" : `View all ${historyReadyCount}`}
              </Link>
            </Button>
          </div>
          <RecentWalksCarousel walks={recent} />
        </section>
      ) : null}
    </>
  );
}
