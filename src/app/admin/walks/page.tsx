import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { connection } from "next/server";
import { WalkListChrome } from "@/components/list-chrome";
import { RememberListCount } from "@/components/remember-list-count";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { prisma } from "@/lib/db";
import { requireAnyPermission } from "@/lib/auth";
import { CreateWalkDrawer } from "../create-walk-drawer";
import { AdminPageIntro } from "../admin-page-intro";
import { AdminWalkTable } from "../admin-walk-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { upcomingListLookbackFrom, walkStatus } from "@/lib/walk-window";

function toRow(
  walk: {
    id: string;
    title: string;
    location: string | null;
    startsAt: Date;
    durationMins: number;
    endedAt: Date | null;
    cancelledAt: Date | null;
    _count: { attendances: number };
  },
  selfClockedIn = false,
) {
  return {
    id: walk.id,
    title: walk.title,
    location: walk.location,
    startsAt: walk.startsAt.toISOString(),
    durationMins: walk.durationMins,
    endedAt: walk.endedAt?.toISOString() ?? null,
    cancelledAt: walk.cancelledAt?.toISOString() ?? null,
    attendanceCount: walk._count.attendances,
    selfClockedIn,
  };
}

const WALKS_INTRO =
  "Upcoming walks, and every finished walk. Filter by status, sort by date, or search. When a walk is starting soon or in progress, the row says Clock in now — open it and clock in with the same pre-walk check members use. You can also share the link, cancel, reopen, or remove a walk. Long walks stay under Upcoming until clock-in closes.";

async function AdminPageContent() {
  // View and Create are meaningfully independent: View is the schedule/
  // history/cancelled-walk detail, Create is the blank "start a new one"
  // form — an organiser with only Create doesn't need to browse anything
  // first. The other Walks sub-permissions (Edit, Cancel, Attendance, …)
  // all act on a walk someone already found via View or Members, so they
  // don't need their own way into this page.
  const admin = await requireAnyPermission(["permWalksView", "permWalksCreate"]);

  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-6">
      {admin.permWalksView ? (
        <section className="flex flex-col gap-4">
          <AdminPageIntro
            action={admin.permWalksCreate ? <CreateWalkDrawer /> : null}
            description={WALKS_INTRO}
            title="Walks"
          />
          {/* The heading and Create button show straight away; only the list waits. */}
          <Suspense fallback={<AdminWalksSkeleton />}>
            <PlaceholderPreview fallback={<AdminWalksSkeleton />}>
              <AdminWalksTabs userId={admin.id} />
            </PlaceholderPreview>
          </Suspense>
        </section>
      ) : admin.permWalksCreate ? (
        // Create without View: no list to attach the button to (see the
        // permission split noted above), so it still gets its own small
        // section rather than disappearing entirely.
        <section className="flex flex-col gap-4">
          <AdminPageIntro
            action={<CreateWalkDrawer />}
            description="A share link is generated automatically. People must be signed in to clock in. If they do not have an account yet, they create one first. If they already have one, they sign in. The link brings them back to this walk afterwards."
            title="Create a walk"
          />
        </section>
      ) : null}
    </div>
  );
}

/** The Upcoming / History tabs — the part of the page that waits for data. */
async function AdminWalksTabs({ userId }: { userId: string }) {
  // Upcoming vs History depends on the time now — worked out per visit.
  await connection();
  // A Create-only organiser (no View) never sees the list below at all —
  // no need to even query it for them.
  const lookback = upcomingListLookbackFrom();
  const base = {
    id: true,
    title: true,
    location: true,
    startsAt: true,
    durationMins: true,
    endedAt: true,
    cancelledAt: true,
  } as const;

  const [recent, older] = await Promise.all([
    prisma.walk.findMany({
      where: { startsAt: { gte: lookback } },
      orderBy: { startsAt: "asc" },
      take: 200,
      select: {
        ...base,
        // Full clock-in count for History; still-on-walk for Upcoming's
        // "On the walk" label (early leavers stay in History totals).
        _count: { select: { attendances: true } },
        attendances: {
          where: { clockedOutAt: null },
          select: { userId: true },
        },
      },
    }),
    prisma.walk.findMany({
      where: { startsAt: { lt: lookback } },
      orderBy: { startsAt: "desc" },
      // A weekly walk never missed would take ~19 years to reach this —
      // comfortably past the lifetime of this app — so it never trims a
      // realistic History tab. It exists purely as a backstop against an
      // unbounded query if the group's data ever grows in an unexpected way.
      take: 1000,
      select: {
        ...base,
        _count: { select: { attendances: true } },
      },
    }),
  ]);

  const upcoming = recent
    .filter((walk) => walkStatus(walk) !== "completed")
    .map((walk) =>
      toRow(
        {
          ...walk,
          _count: { attendances: walk.attendances.length },
        },
        walk.attendances.some((row) => row.userId === userId),
      ),
    );
  const past = [...recent.filter((walk) => walkStatus(walk) === "completed"), ...older]
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    .map((walk) => toRow(walk));

  return (
    <>
    <RememberListCount count={Math.min(upcoming.length, LIST_PAGE_SIZE)} id="admin-walks" />
    <RememberListCount count={upcoming.length} id="admin-walks-upcoming" max={10000} />
    <RememberListCount count={past.length} id="admin-walks-past" max={10000} />
    <Tabs className="w-full" defaultValue="upcoming">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
        <TabsTrigger value="past">History ({past.length})</TabsTrigger>
      </TabsList>
      <TabsContent className="mt-4 data-[state=inactive]:hidden" forceMount value="upcoming">
        <AdminWalkTable
          attendanceLabel="On the walk"
          emptyDescription="Create one and it will show here."
          emptyTitle="No walks scheduled"
          scope="upcoming"
          walks={upcoming}
        />
      </TabsContent>
      <TabsContent className="mt-4" value="past">
        <AdminWalkTable
          emptyDescription="Finished walks will show here."
          emptyTitle="No past walks yet"
          scope="past"
          walks={past}
        />
      </TabsContent>
    </Tabs>
    </>
  );
}

/** Tabs, search and filters stay as the real controls. Only the walk rows
 * are placeholders — as many as the list last showed, from the first paint. */
function AdminWalksSkeleton() {
  return (
    <div className="contents" data-page-loading="">
      <WalkListChrome />
    </div>
  );
}

function AdminWalksPageFallback() {
  return (
    <div data-page-loading="" className="flex flex-col gap-8 px-4 py-6 md:px-6">
      <section className="flex flex-col gap-4">
        <AdminPageIntro description={WALKS_INTRO} title="Walks" />
        <AdminWalksSkeleton />
      </section>
    </div>
  );
}

/** Everything here depends on who's asking and on live data, so the page
 * shows a matching placeholder for an instant while it loads. */
export default function AdminWalksPage() {
  return (
    <Suspense fallback={<AdminWalksPageFallback />}>
      <AdminPageContent />
    </Suspense>
  );
}

