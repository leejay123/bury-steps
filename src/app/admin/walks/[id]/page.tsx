import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin, displayName } from "@/lib/auth";
import { formatWalkDate } from "@/lib/dates";
import { walkStatus } from "@/lib/walk-window";
import { appUrl } from "@/lib/urls";
import { ShareLink } from "@/components/share-link";
import { EmptyState } from "@/components/empty-state";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { CancelWalkButton } from "./cancel-walk-button";
import { RescheduleWalkButton } from "./reschedule-walk-button";
import { ReopenWalkButton } from "./reopen-walk-button";
import { DeleteWalkButton } from "./delete-walk-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WalkAttendanceTable, type WalkAttendanceRow } from "./walk-attendance";

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

  const attendances = walk.attendances;
  const stillIn = attendances.filter((a) => !a.clockedOutAt);
  const clockedOut = attendances.filter((a) => a.clockedOutAt);
  const withConditions = attendances.filter((a) => a.conditions).length;

  function toAttendanceRow(attendance: (typeof attendances)[number]): WalkAttendanceRow {
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
  }

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
          <WalkStatusBadge status={walkStatus(walk)} />
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

      {/*
        Split into two lists rather than one merged table: "Attendance" is
        who is on the walk right now, full stop — someone who clocked out
        has left, so they no longer belong there, even with a badge. Their
        record isn't lost (it's still in Clocked out below, in their walk
        history, and in the CSV export) but the live headcount and the rows
        under it now always agree, instead of the header saying "1 on the
        walk" while the table still lists 2 people.
      */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Attendance</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            {stillIn.length} on the walk · Click a row for details
          </span>
        </div>

        {stillIn.length === 0 ? (
          <EmptyState
            description={
              walk.attendances.length === 0
                ? "Share the link above with the group."
                : "Everyone who clocked in has since clocked out."
            }
            icon={ClipboardList}
            title={
              walk.attendances.length === 0
                ? "Nobody has clocked in yet"
                : "Nobody is on the walk right now"
            }
          />
        ) : (
          <WalkAttendanceTable rows={stillIn.map(toAttendanceRow)} />
        )}
      </section>

      {clockedOut.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Clocked out</h2>
            <span className="text-sm tabular-nums text-muted-foreground">
              {clockedOut.length} {clockedOut.length === 1 ? "person" : "people"} · left early or
              after finishing · click a row for details
            </span>
          </div>
          <WalkAttendanceTable rows={clockedOut.map(toAttendanceRow)} />
        </section>
      ) : null}
    </div>
  );
}
