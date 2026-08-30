import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { CreateWalkForm } from "./create-walk-form";
import { AdminPageIntro } from "./admin-page-intro";
import { AdminWalkTable } from "./admin-walk-table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { upcomingListLookbackFrom, walkStatus } from "@/lib/walk-window";

export const dynamic = "force-dynamic";

function toRow(walk: {
  id: string;
  title: string;
  location: string | null;
  startsAt: Date;
  durationMins: number;
  cancelledAt: Date | null;
  _count: { attendances: number };
}) {
  return {
    id: walk.id,
    title: walk.title,
    location: walk.location,
    startsAt: walk.startsAt.toISOString(),
    durationMins: walk.durationMins,
    cancelledAt: walk.cancelledAt?.toISOString() ?? null,
    attendanceCount: walk._count.attendances,
  };
}

export default async function AdminPage() {
  await requireAdmin();

  const lookback = upcomingListLookbackFrom();
  const base = {
    id: true,
    title: true,
    location: true,
    startsAt: true,
    durationMins: true,
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

  const upcoming = recent.filter((walk) => walkStatus(walk) !== "completed");
  const past = [
    ...recent.filter((walk) => walkStatus(walk) === "completed"),
    ...older,
  ].sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-6">
      <section className="flex flex-col gap-4">
        <AdminPageIntro
          description="A share link is generated automatically. People must be signed in to clock in. If they do not have an account yet, they create one first. If they already have one, they sign in. The link brings them back to this walk afterwards."
          title="Create a walk"
        />
        <CreateWalkForm />
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <AdminPageIntro
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
              emptyDescription="Create one above and it will show here."
              emptyTitle="No walks scheduled"
              scope="upcoming"
              walks={upcoming.map(toRow)}
            />
          </TabsContent>
          <TabsContent className="mt-4" value="past">
            <AdminWalkTable
              emptyDescription="Finished walks will show here."
              emptyTitle="No past walks yet"
              scope="past"
              walks={past.map(toRow)}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
