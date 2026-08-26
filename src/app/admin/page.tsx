import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatWalkDate } from "@/lib/dates";
import { CreateWalkForm } from "./create-walk-form";
import { AdminPageIntro } from "./admin-page-intro";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

type WalkRow = {
  id: string;
  title: string;
  location: string | null;
  startsAt: Date;
  cancelledAt: Date | null;
  _count: { attendances: number };
};

function WalkTable({ walks, empty }: { walks: WalkRow[]; empty: string }) {
  if (walks.length === 0) {
    return <p className="py-8 text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Walk</TableHead>
            <TableHead>When</TableHead>
            <TableHead className="hidden sm:table-cell">Meeting point</TableHead>
            <TableHead className="text-right">Clock-ins</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-8">
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {walks.map((walk) => (
            <TableRow key={walk.id} className="relative">
              <TableCell className="font-medium">
                <Link className="after:absolute after:inset-0" href={`/admin/walks/${walk.id}`}>
                  {walk.title}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatWalkDate(walk.startsAt)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {walk.location || "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{walk._count.attendances}</TableCell>
              <TableCell>
                {walk.cancelledAt ? <Badge variant="destructive">Cancelled</Badge> : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <ChevronRight className="size-4" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function AdminPage() {
  await requireAdmin();

  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const select = {
    id: true,
    title: true,
    location: true,
    startsAt: true,
    cancelledAt: true,
    _count: { select: { attendances: { where: { clockedOutAt: null } } } },
  } as const;

  const [upcoming, past] = await Promise.all([
    prisma.walk.findMany({
      where: { startsAt: { gte: cutoff } },
      orderBy: { startsAt: "asc" },
      select,
    }),
    prisma.walk.findMany({
      where: { startsAt: { lt: cutoff } },
      orderBy: { startsAt: "desc" },
      take: 30,
      select,
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
          description="Upcoming walks and recent ones. Open a walk to share the link, cancel it, reopen it, or remove it."
          title="Walks"
        />
        <Tabs className="w-full" defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent className="mt-4" value="upcoming">
            <WalkTable empty="No walks scheduled. Create one above." walks={upcoming} />
          </TabsContent>
          <TabsContent className="mt-4" value="past">
            <WalkTable empty="No past walks yet." walks={past} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
