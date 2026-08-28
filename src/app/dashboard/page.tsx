import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Footprints } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCompactDateTime, formatDate, formatMembershipAge } from "@/lib/dates";
import { windowState } from "@/lib/walk-window";
import { CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";
import { Button } from "@/components/ui/button";
import { getWalkMemberNamesByWalkIds } from "@/lib/walk-members";
import { UpcomingWalkCards } from "./upcoming-walk-cards";

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
      include: { walk: { select: { title: true, token: true, startsAt: true, cancelledAt: true } } },
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
          Member since {formatDate(user.createdAt)} · {formatMembershipAge(user.createdAt)}. Upcoming
          walks, including any that have been cancelled. Clock in on the day from here. Past walks
          are in History.
        </p>
      </div>

      {walks.length === 0 ? (
        <EmptyState
          description="Your organiser will post the next one here."
          icon={Footprints}
          title="No walks scheduled yet"
        />
      ) : (
        <UpcomingWalkCards
          walks={walks.map((walk) => {
            const clockedIn = walk.attendances[0];
            return {
              id: walk.id,
              token: walk.token,
              title: walk.title,
              description: walk.description,
              location: walk.location,
              startsAt: walk.startsAt.toISOString(),
              durationMins: walk.durationMins,
              cancelledAt: walk.cancelledAt?.toISOString() ?? null,
              clockedInAt: clockedIn ? clockedIn.clockedInAt.toISOString() : null,
              state: windowState(walk.startsAt, walk.durationMins, now),
              memberNames: memberNamesByWalk.get(walk.id) ?? [],
            };
          })}
        />
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
          <DataList>
            {history.map((attendance) => (
              <DataListItem className="relative" key={attendance.id}>
                <DataListBody>
                  <p className="font-medium">
                    <Link className="after:absolute after:inset-0" href={`/w/${attendance.walk.token}`}>
                      {attendance.walk.title}
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    In {formatCompactDateTime(attendance.clockedInAt)}
                    {attendance.clockedOutAt
                      ? ` · Out ${formatCompactDateTime(attendance.clockedOutAt)}`
                      : ""}
                  </p>
                  {attendance.walk.cancelledAt ? (
                    <p className="text-xs text-destructive">Cancelled</p>
                  ) : null}
                </DataListBody>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </DataListItem>
            ))}
          </DataList>
        </section>
      ) : null}
    </div>
  );
}
