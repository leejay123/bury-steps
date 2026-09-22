import { prisma } from "@/lib/db";
import { requireAnyPermission } from "@/lib/auth";
import { CreateWalkDrawer } from "./create-walk-drawer";
import { AdminPageIntro } from "./admin-page-intro";
import { AdminWalkTable } from "./admin-walk-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { upcomingListLookbackFrom, walkStatus } from "@/lib/walk-window";

export const dynamic = "force-dynamic";

function toRow(walk: {
  id: string;
  title: string;
  location: string | null;
  startsAt: Date;
  durationMins: number;
  endedAt: Date | null;
  cancelledAt: Date | null;
  _count: { attendances: number };
}) {
  return {
    id: walk.id,
    title: walk.title,
    location: walk.location,
    startsAt: walk.startsAt.toISOString(),
    durationMins: walk.durationMins,
    endedAt: walk.endedAt?.toISOString() ?? null,
    cancelledAt: walk.cancelledAt?.toISOString() ?? null,
    attendanceCount: walk._count.attendances,
  };
}

export default async function AdminPage() {
  // View and Create are meaningfully independent: View is the schedule/
  // history/cancelled-walk detail, Create is the blank "start a new one"
  // form — an organiser with only Create doesn't need to browse anything
  // first. The other Walks sub-permissions (Edit, Cancel, Attendance, …)
  // all act on a walk someone already found via View or Members, so they
  // don't need their own way into this page.
  const admin = await requireAnyPermission(["permWalksView", "permWalksCreate"]);

  // A Create-only organiser (no View) never sees the list below at all —
  // no need to even query it for them.
  let upcoming: ReturnType<typeof toRow>[] = [];
  let past: ReturnType<typeof toRow>[] = [];
  if (admin.permWalksView) {
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
          _count: { select: { attendances: { where: { clockedOutAt: null } } } },
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

    upcoming = recent.filter((walk) => walkStatus(walk) !== "completed").map(toRow);
    past = [
      ...recent.filter((walk) => walkStatus(walk) === "completed"),
      ...older,
    ]
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
      .map(toRow);
  }

  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-6">
      {admin.permWalksView ? (
        <section className="flex flex-col gap-4">
          <AdminPageIntro
            action={admin.permWalksCreate ? <CreateWalkDrawer /> : null}
            description="Upcoming walks, and every finished walk. Filter by status, sort by date, or search. Open a walk to share the link, cancel it, reopen it, or remove it. Long walks stay under Upcoming until clock-in closes."
            title="Walks"
          />
          <Tabs className="w-full" defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">History ({past.length})</TabsTrigger>
            </TabsList>
            <TabsContent className="mt-4" value="upcoming">
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
