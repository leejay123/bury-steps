import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { notFound } from "next/navigation";
import { cacheLife } from "next/cache";
import { WalkListChrome } from "@/components/list-chrome";
import { RememberListCount } from "@/components/remember-list-count";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { prisma } from "@/lib/db";
import { getOptionalAdmin } from "@/lib/auth";
import { CreateWalkDrawer } from "../create-walk-drawer";
import { AdminPageIntro } from "../admin-page-intro";
import { AdminWalkTable } from "../admin-walk-table";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryTabs } from "@/components/query-tabs";
import { upcomingListLookbackFrom, walkStatus } from "@/lib/walk-window";
import { StoriesSlot } from "@/components/stories/stories-slot";
import { getUpcomingWalkLines } from "@/lib/upcoming-walk-lines";

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

const WALKS_INTRO = "Upcoming walks first. Finished and cancelled walks are under History.";

/**
 * The organiser's Walks page, as a private saved copy: kept in this browser
 * only for five minutes (never on the server), so the page fetched ahead
 * from the menu can carry it and opens with no placeholder. Any walk
 * change or clock-in refreshes it at once. The table works out each walk's
 * status from this device's clock, so a copy a few minutes old still sorts
 * Upcoming correctly. See node_modules/next/dist/docs/01-app/02-guides/
 * optimizing-prefetching.md.
 */
async function getAdminWalksView() {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  // View and Create are meaningfully independent: View is the schedule/
  // history/cancelled-walk detail, Create is the blank "start a new one"
  // form — an organiser with only Create doesn't need to browse anything
  // first. The other Walks sub-permissions (Edit, Cancel, Attendance, …)
  // all act on a walk someone already found via View or Members, so they
  // don't need their own way into this page.
  const admin = await getOptionalAdmin();
  if (!admin || !(admin.permWalksView || admin.permWalksCreate)) return null;
  if (!admin.permWalksView) return { canView: false as const, canCreate: admin.permWalksCreate };
  return { canView: true as const, canCreate: admin.permWalksCreate, ...(await loadAdminWalks(admin.id)) };
}

/** Create a walk, for organisers allowed to (from the same saved copy as the list). */
async function CreateWalkAction() {
  const view = await getAdminWalksView();
  return view?.canCreate ? <CreateWalkDrawer /> : null;
}

/** The list (the part that waits for data); with Create but not View, a note instead. */
async function AdminWalksList() {
  const view = await getAdminWalksView();
  if (!view) notFound();
  if (!view.canView)
    return (
      <p className="text-sm text-muted-foreground">
        A share link is generated automatically. People must be signed in to clock in. If they do not have an account
        yet, they create one first. If they already have one, they sign in. The link brings them back to this walk
        afterwards.
      </p>
    );
  return <AdminWalksTabs />;
}

/** Upcoming and History rows. Upcoming vs History depends on the time now. */
async function loadAdminWalks(userId: string) {
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
      // Ties (two walks at one time) in a fixed order, the same one the list's
      // placeholder uses (lib/upcoming-walk-lines.ts), so rows don't swap as it loads.
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
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

  // Cancelled walks go under History with the finished ones, not Upcoming.
  const finishedOrCancelled = (walk: (typeof recent)[number]) => {
    const status = walkStatus(walk);
    return status === "completed" || status === "cancelled";
  };
  const upcoming = recent
    .filter((walk) => !finishedOrCancelled(walk))
    .map((walk) =>
      toRow(
        {
          ...walk,
          _count: { attendances: walk.attendances.length },
        },
        walk.attendances.some((row) => row.userId === userId),
      ),
    );
  const past = [...recent.filter(finishedOrCancelled), ...older]
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    .map((walk) => toRow(walk));

  return { upcoming, past };
}

/** The Upcoming / History tabs — the part of the page that waits for data. */
async function AdminWalksTabs() {
  const view = await getAdminWalksView();
  if (!view?.canView) return null;
  const { upcoming, past } = view;
  return (
    <>
    <RememberListCount count={Math.min(upcoming.length, LIST_PAGE_SIZE)} id="admin-walks" />
    <RememberListCount count={upcoming.length} id="admin-walks-upcoming" max={10000} />
    <RememberListCount count={past.length} id="admin-walks-past" max={10000} />
    <QueryTabs className="w-full" defaultValue="upcoming">
      <div data-edge-bar="" data-edge-top="">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">History ({past.length})</TabsTrigger>
        </TabsList>
      </div>
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
    </QueryTabs>
    </>
  );
}

/** Tabs, search and filters stay as the real controls. Only the walk rows
 * are placeholders — as many as the list last showed, from the first paint. */
function AdminWalksSkeleton() {
  // Drawn at once with plain grey lines; its rows take the next walks' names as soon as
  // that saved copy is read (normally at once), so each row is the real row's height.
  return (
    <div className="contents" data-page-loading="">
      <Suspense fallback={<WalkListChrome />}>
        <WalkListChromeWithNames />
      </Suspense>
    </div>
  );
}

async function WalkListChromeWithNames() {
  return <WalkListChrome lines={await getUpcomingWalkLines()} />;
}

/**
 * Fetched ahead from the menu (see PARTIAL_PREFETCH_ROUTES), so the page
 * opens with its walks already there.
 */
export const prefetch = "partial";

export default function AdminWalksPage() {
  // The page's own frame, title, button and Stories draw at once (the static
  // shell); only the list waits for its data, behind its own placeholder —
  // Next.js docs: optimizing-the-static-shell ("keep static UI in the shell").
  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-6">
      {/* One card in the shadcn.io dashboard from tablets up: the top, Stories and the list. */}
      <section className="flex flex-col gap-4" data-page-card="">
        <AdminPageIntro
          action={
            // Until the permission is known, the button itself (almost every organiser has it).
            <Suspense fallback={<CreateWalkDrawer />}>
              <CreateWalkAction />
            </Suspense>
          }
          description={WALKS_INTRO}
          title="Walks"
        />
        <StoriesSlot />
        <Suspense fallback={<AdminWalksSkeleton />}>
          <PlaceholderPreview fallback={<AdminWalksSkeleton />}>
            <AdminWalksList />
          </PlaceholderPreview>
        </Suspense>
      </section>
    </div>
  );
}
