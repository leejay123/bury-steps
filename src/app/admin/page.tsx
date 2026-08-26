import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { CreateWalkForm } from "./create-walk-form";
import { AdminPageIntro } from "./admin-page-intro";
import { AdminWalkTable } from "./admin-walk-table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

function toRow(walk: {
  id: string;
  title: string;
  location: string | null;
  startsAt: Date;
  cancelledAt: Date | null;
  _count: { attendances: number };
}) {
  return {
    id: walk.id,
    title: walk.title,
    location: walk.location,
    startsAt: walk.startsAt.toISOString(),
    cancelledAt: walk.cancelledAt?.toISOString() ?? null,
    attendanceCount: walk._count.attendances,
  };
}

export default async function AdminPage() {
  await requireAdmin();

  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const base = {
    id: true,
    title: true,
    location: true,
    startsAt: true,
    cancelledAt: true,
  } as const;

  const [upcoming, past] = await Promise.all([
    prisma.walk.findMany({
      where: { startsAt: { gte: cutoff } },
      orderBy: { startsAt: "asc" },
      select: {
        ...base,
        _count: { select: { attendances: { where: { clockedOutAt: null } } } },
      },
    }),
    prisma.walk.findMany({
      where: { startsAt: { lt: cutoff } },
      orderBy: { startsAt: "desc" },
      select: {
        ...base,
        _count: { select: { attendances: true } },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
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
          description="Upcoming walks, and every finished walk. Open a walk to share the link, cancel it, reopen it, or remove it."
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
              walks={upcoming.map(toRow)}
            />
          </TabsContent>
          <TabsContent className="mt-4" value="past">
            <AdminWalkTable
              emptyDescription="Finished walks will show here."
              emptyTitle="No past walks yet"
              searchable
              walks={past.map(toRow)}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
