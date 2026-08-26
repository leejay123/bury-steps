import Link from "next/link";
import { redirect } from "next/navigation";
import { Footprints } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatWalkDate, formatDateTime } from "@/lib/dates";
import { windowState } from "@/lib/walk-window";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalkMembers } from "@/components/walk-members";
import { ClockOutButton } from "@/components/clock-out-button";
import { getWalkMemberNamesByWalkIds } from "@/lib/walk-members";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const now = new Date();

  const [upcoming, history] = await Promise.all([
    prisma.walk.findMany({
      where: { startsAt: { gte: new Date(now.getTime() - 3 * 60 * 60 * 1000) } },
      orderBy: { startsAt: "asc" },
      take: 10,
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
      where: { userId: user.id },
      orderBy: { clockedInAt: "desc" },
      take: 10,
      include: { walk: { select: { title: true, startsAt: true } } },
    }),
  ]);

  const clockedWalkIds = upcoming
    .filter((walk) => walk.attendances.length > 0)
    .map((walk) => walk.id);
  const memberNamesByWalk = await getWalkMemberNamesByWalkIds(clockedWalkIds);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Walks</h1>
      </div>

      <section className="space-y-3">
        {upcoming.length === 0 && (
          <EmptyState
            description="Your organiser will post the next one here."
            icon={Footprints}
            title="No walks scheduled yet"
          />
        )}

        {upcoming.map((walk) => {
          const clockedIn = walk.attendances[0];
          const state = windowState(walk.startsAt, walk.durationMins, now);
          return (
            <Card key={walk.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{walk.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatWalkDate(walk.startsAt)}
                      {walk.location ? ` · ${walk.location}` : ""}
                    </p>
                  </div>
                  {walk.cancelledAt ? (
                    <Badge variant="destructive">Cancelled</Badge>
                  ) : clockedIn ? (
                    <Badge variant="secondary">Clocked in</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {walk.description && (
                  <p className="text-sm leading-relaxed">{walk.description}</p>
                )}
                {walk.cancelledAt ? (
                  <p className="text-sm text-destructive">This walk has been cancelled.</p>
                ) : null}
                {!walk.cancelledAt && !clockedIn && (
                  <Button asChild size="sm" disabled={state === "closed"}>
                    <Link href={`/w/${walk.token}`}>
                      {state === "open" ? "Clock in" : "Open pre-walk check"}
                    </Link>
                  </Button>
                )}
                {clockedIn && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground">
                      Clocked in at {formatDateTime(clockedIn.clockedInAt)}
                    </p>
                    <ClockOutButton token={walk.token} />
                    <WalkMembers names={memberNamesByWalk.get(walk.id) ?? []} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Your recent walks</h2>
          <ul className="divide-y overflow-hidden rounded-xl border text-sm">
            {history.map((a) => (
              <li key={a.walk.title + a.clockedInAt.toISOString()} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate">{a.walk.title}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {a.clockedOutAt ? "Clocked out · " : ""}
                  {formatDateTime(a.clockedInAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
