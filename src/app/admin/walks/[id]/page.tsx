import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin, displayName } from "@/lib/auth";
import { formatWalkDate } from "@/lib/dates";
import { windowState } from "@/lib/walk-window";
import { appUrl } from "@/lib/urls";
import { ShareLink } from "@/components/share-link";
import { EmptyState } from "@/components/empty-state";
import { CancelWalkButton } from "./cancel-walk-button";
import { RescheduleWalkButton } from "./reschedule-walk-button";
import { ReopenWalkButton } from "./reopen-walk-button";
import { DeleteWalkButton } from "./delete-walk-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WalkAttendanceTable } from "./walk-attendance";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function WalkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const walk = await prisma.walk.findUnique({
    where: { id },
    select: {
      id: true,
      token: true,
      title: true,
      description: true,
      location: true,
      startsAt: true,
      durationMins: true,
      cancelledAt: true,
      cancelledReason: true,
      attendances: {
        orderBy: [{ clockedOutAt: "asc" }, { clockedInAt: "asc" }],
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });

  if (!walk) notFound();

  const state = windowState(walk.startsAt, walk.durationMins);
  const stillIn = walk.attendances.filter((a) => !a.clockedOutAt);
  const clockedOut = walk.attendances.filter((a) => a.clockedOutAt);
  const withConditions = walk.attendances.filter((a) => a.conditions).length;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; All walks
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle className="text-2xl">{walk.title}</CardTitle>
            <CardDescription>
              {formatWalkDate(walk.startsAt)}
              {walk.location ? ` · ${walk.location}` : ""} · {walk.durationMins} min
            </CardDescription>
          </div>
          {walk.cancelledAt ? (
            <Badge variant="destructive">Cancelled</Badge>
          ) : state === "open" ? (
            <Badge>Clock-in open</Badge>
          ) : state === "too-early" ? (
            <Badge variant="secondary">Upcoming</Badge>
          ) : (
            <Badge variant="outline">Finished</Badge>
          )}
        </CardHeader>
        {walk.description || (walk.cancelledAt && walk.cancelledReason) ? (
          <CardContent className="flex flex-col gap-2">
            {walk.description ? (
              <p className="text-sm leading-relaxed">{walk.description}</p>
            ) : null}
            {walk.cancelledAt && walk.cancelledReason ? (
              <p className="text-sm text-destructive">Cancelled: {walk.cancelledReason}</p>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      <ShareLink url={`${appUrl()}/w/${walk.token}`} />

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <a href={`/admin/walks/${walk.id}/export`}>Download roster (CSV)</a>
        </Button>
        {!walk.cancelledAt && (
          <CancelWalkButton walkId={walk.id} attendanceCount={stillIn.length} />
        )}
        <RescheduleWalkButton
          cancelled={Boolean(walk.cancelledAt)}
          durationMins={walk.durationMins}
          location={walk.location}
          startsAt={walk.startsAt.toISOString()}
          walkId={walk.id}
        />
        {walk.cancelledAt ? <ReopenWalkButton walkId={walk.id} /> : null}
        <DeleteWalkButton walkId={walk.id} attendanceCount={walk.attendances.length} />
      </div>

      <Separator />

      {withConditions > 0 && (
        <Alert>
          <AlertTitle>
            {withConditions} {withConditions === 1 ? "member has" : "members have"} reported a
            condition
          </AlertTitle>
          <AlertDescription>
            Read these before setting off. They are deleted 90 days after the walk.
          </AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Attendance</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            {stillIn.length} on the walk
            {clockedOut.length > 0 ? ` · ${clockedOut.length} clocked out` : ""}
            {" · Click a row for details"}
          </span>
        </div>

        {walk.attendances.length === 0 ? (
          <EmptyState
            description="Share the link above with the group."
            icon={ClipboardList}
            title="Nobody has clocked in yet"
          />
        ) : (
          <WalkAttendanceTable
            rows={walk.attendances.map((attendance) => {
              const name = displayName(attendance.user);
              return {
                id: attendance.id,
                name,
                email: attendance.user.email,
                initials: initials(name),
                clockedInAt: attendance.clockedInAt.toISOString(),
                clockedOutAt: attendance.clockedOutAt?.toISOString() ?? null,
                clockedOutReason: attendance.clockedOutReason,
                conditions: attendance.conditions,
              };
            })}
          />
        )}
      </section>
    </div>
  );
}
