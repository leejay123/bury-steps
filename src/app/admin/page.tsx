import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatWalkDate } from "@/lib/dates";
import { CreateWalkForm } from "./create-walk-form";
import { ShareLink } from "@/components/share-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

type WalkRow = {
  id: string;
  token: string;
  title: string;
  location: string | null;
  startsAt: Date;
  cancelledAt: Date | null;
  _count: { attendances: number };
};

function WalkList({ walks, baseUrl, empty }: { walks: WalkRow[]; baseUrl: string; empty: string }) {
  if (walks.length === 0) {
    return (
      <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">{empty}</p>
    );
  }

  return (
    <ul className="space-y-3">
      {walks.map((walk) => (
        <li key={walk.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Link
                href={`/admin/walks/${walk.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {walk.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatWalkDate(walk.startsAt)}
                {walk.location ? ` \u00B7 ${walk.location}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {walk.cancelledAt && <Badge variant="destructive">Cancelled</Badge>}
              <Badge variant="secondary" className="tabular-nums">
                {walk._count.attendances}
              </Badge>
            </div>
          </div>
          <div className="mt-3">
            <ShareLink url={`${baseUrl}/w/${walk.token}`} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminPage() {
  await requireAdmin();

  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const select = {
    id: true,
    token: true,
    title: true,
    location: true,
    startsAt: true,
    cancelledAt: true,
    _count: { select: { attendances: true } },
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Organiser tools</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create a walk</CardTitle>
          <CardDescription>
            A share link is generated automatically. Members need an account to clock in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWalkForm />
        </CardContent>
      </Card>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <WalkList walks={upcoming} baseUrl={baseUrl} empty="No walks scheduled. Create one above." />
        </TabsContent>
        <TabsContent value="past">
          <WalkList walks={past} baseUrl={baseUrl} empty="No past walks yet." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
