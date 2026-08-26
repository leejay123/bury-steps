import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Clock, Footprints, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatWalkDate } from "@/lib/dates";
import { windowState } from "@/lib/walk-window";
import { CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalkMembers } from "@/components/walk-members";
import { ClockOutButton } from "@/components/clock-out-button";
import { getWalkMemberNamesByWalkIds } from "@/lib/walk-members";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const now = new Date();
  const upcomingFrom = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const cancelledFrom = new Date(
    now.getTime() - CANCELLED_WALK_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  const [walks, history, historyCount] = await Promise.all([
    prisma.walk.findMany({
      where: {
        OR: [{ startsAt: { gte: upcomingFrom } }, { cancelledAt: { gte: cancelledFrom } }],
      },
      orderBy: { startsAt: "asc" },
      take: 20,
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
      take: 5,
      include: { walk: { select: { title: true, startsAt: true, cancelledAt: true } } },
    }),
    prisma.attendance.count({ where: { userId: user.id } }),
  ]);

  const clockedWalkIds = walks
    .filter((walk) => walk.attendances.length > 0)
    .map((walk) => walk.id);
  const memberNamesByWalk = await getWalkMemberNamesByWalkIds(clockedWalkIds);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Walks</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming walks, including any that have been cancelled. Clock in on the day from here.
          Past walks are in History.
        </p>
      </div>

      {walks.length === 0 ? (
        <EmptyState
          description="Your organiser will post the next one here."
          icon={Footprints}
          title="No walks scheduled yet"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {walks.map((walk) => {
            const clockedIn = walk.attendances[0];
            const state = windowState(walk.startsAt, walk.durationMins, now);
            return (
              <Card key={walk.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <CardTitle className="text-base">{walk.title}</CardTitle>
                    <CardDescription className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        {formatWalkDate(walk.startsAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {walk.durationMins} min
                        {walk.location ? (
                          <>
                            <MapPin className="ml-1.5 size-3.5" />
                            {walk.location}
                          </>
                        ) : null}
                      </span>
                    </CardDescription>
                  </div>
                  {walk.cancelledAt ? (
                    <Badge variant="destructive">Cancelled</Badge>
                  ) : clockedIn ? (
                    <Badge variant="secondary">Clocked in</Badge>
                  ) : state === "open" ? (
                    <Badge>Clock-in open</Badge>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {walk.description ? (
                    <p className="text-sm leading-relaxed">{walk.description}</p>
                  ) : null}
                  {walk.cancelledAt ? (
                    <p className="text-sm text-destructive">This walk has been cancelled.</p>
                  ) : null}
                  {!walk.cancelledAt && !clockedIn ? (
                    <div>
                      <Button asChild disabled={state === "closed"} size="sm">
                        <Link href={`/w/${walk.token}`}>
                          {state === "open" ? "Clock in" : "Open pre-walk check"}
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                  {clockedIn && !walk.cancelledAt ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-sm text-muted-foreground">
                        Clocked in at {formatDateTime(clockedIn.clockedInAt)}
                      </p>
                      <div>
                        <ClockOutButton token={walk.token} />
                      </div>
                      <WalkMembers names={memberNamesByWalk.get(walk.id) ?? []} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {historyCount > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Your recent walks</h2>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/history">
                {historyCount === 1 ? "View history" : `View all ${historyCount}`}
              </Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Walk</TableHead>
                <TableHead>Clocked in</TableHead>
                <TableHead>Clocked out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((attendance) => (
                <TableRow key={attendance.id}>
                  <TableCell>
                    <p className="font-medium">{attendance.walk.title}</p>
                    {attendance.walk.cancelledAt ? (
                      <p className="text-xs text-destructive">Cancelled</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(attendance.clockedInAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {attendance.clockedOutAt
                      ? formatDateTime(attendance.clockedOutAt)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : null}
    </div>
  );
}
