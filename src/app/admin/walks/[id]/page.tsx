import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, CalendarPlus, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin, displayName } from "@/lib/auth";
import { formatWalkDate, utcToLondonWallClock } from "@/lib/dates";
import { canOrganiserAddAttendance, canOrganiserEditJourney, canAddWalkToCalendar, isWalkScheduleLocked, walkStatus } from "@/lib/walk-window";
import { appUrl } from "@/lib/urls";
import { ShareLink } from "@/components/share-link";
import { EmptyState } from "@/components/empty-state";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { WalkMapSection } from "@/components/walk-map-section";
import { meetingPointLabel } from "@/lib/geocode";
import { ensureWalkSlug, walkShareUrl } from "@/lib/walk-slug";
import { CancelWalkButton } from "./cancel-walk-button";
import { DuplicateWalkButton } from "./duplicate-walk-button";
import { EditWalkButton } from "./edit-walk-button";
import { AddAttendanceButton } from "./add-attendance-button";
import { ReopenWalkButton } from "./reopen-walk-button";
import { DeleteWalkButton } from "./delete-walk-button";
import { WalkJourneyManager } from "./walk-journey";
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
      slug: true,
      title: true,
      description: true,
      location: true,
      postcode: true,
      latitude: true,
      longitude: true,
      startsAt: true,
      durationMins: true,
      cancelledAt: true,
      cancelledReason: true,
      attendances: {
        orderBy: [{ clockedOutAt: "asc" }, { clockedInAt: "asc" }],
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
      journeyEvents: {
        orderBy: { happenedAt: "asc" },
        select: { id: true, title: true, body: true, happenedAt: true },
      },
    },
  });

  if (!walk) notFound();

  const slug = await ensureWalkSlug(walk);
  const meeting = meetingPointLabel(walk.location, walk.postcode);
  const attendances = walk.attendances;
  const stillIn = attendances.filter((a) => !a.clockedOutAt);
  const clockedOut = attendances.filter((a) => a.clockedOutAt);
  const withConditions = attendances.filter((a) => a.conditions).length;
  const status = walkStatus(walk);
  const isCompleted = status === "completed";
  const scheduleLocked = isWalkScheduleLocked(walk.startsAt);
  const canAddAttendance = canOrganiserAddAttendance(walk);
  const canEditJourney = canOrganiserEditJourney(walk);
  const showCalendar = canAddWalkToCalendar(walk);
  const journeyDefaultAt = utcToLondonWallClock(
    status === "in-progress" ? new Date() : walk.startsAt,
  );
  const journeyEvents = walk.journeyEvents.map((event) => ({
    id: event.id,
    title: event.title,
    body: event.body,
    happenedAt: event.happenedAt.toISOString(),
  }));

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
              {meeting ? ` · ${meeting}` : ""} · {walk.durationMins} min
            </CardDescription>
          </div>
          <WalkStatusBadge
            cancelledAt={walk.cancelledAt?.toISOString() ?? null}
            durationMins={walk.durationMins}
            startsAt={walk.startsAt.toISOString()}
          />
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

      <ShareLink url={walkShareUrl(appUrl(), { token: walk.token, slug })} />

      {meeting ? <WalkMapSection location={meeting} walk={walk} /> : null}

      <div className="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [-ms-overflow-style:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 md:[&>*]:grow">
        <Button asChild size="sm" variant="outline">
          <a href={`/admin/walks/${walk.id}/export`}>
            <Download data-icon="inline-start" />
            Download roster (CSV)
          </a>
        </Button>
        {showCalendar ? (
          <Button asChild size="sm" variant="outline">
            <a download href={`/w/${slug}/ics`}>
              <CalendarPlus data-icon="inline-start" />
              Add to calendar
            </a>
          </Button>
        ) : null}
        <DuplicateWalkButton walkId={walk.id} />
        {/*
          A completed walk already happened — there's nothing left to
          cancel or edit. Cancel only ever applied to a walk that hadn't
          happened yet, and Edit for a completed walk would silently rewrite
          history rather than change a plan. Both actions stay hidden the
          moment the clock-in window has fully closed; Delete and the CSV
          export remain, since a completed walk is still a real record that
          might need correcting or removing.
        */}
        {!walk.cancelledAt && !isCompleted && (
          <CancelWalkButton walkId={walk.id} attendanceCount={stillIn.length} />
        )}
        {!isCompleted && (
          <EditWalkButton
            cancelled={Boolean(walk.cancelledAt)}
            description={walk.description}
            durationMins={walk.durationMins}
            latitude={walk.latitude}
            location={walk.location}
            longitude={walk.longitude}
            postcode={walk.postcode}
            scheduleLocked={scheduleLocked}
            startsAt={walk.startsAt.toISOString()}
            title={walk.title}
            walkId={walk.id}
          />
        )}
        {walk.cancelledAt ? <ReopenWalkButton walkId={walk.id} /> : null}
        <DeleteWalkButton walkId={walk.id} attendanceCount={walk.attendances.length} />
      </div>
      {isCompleted ? (
        <Alert>
          <AlertDescription>
            This walk has finished, so it can no longer be cancelled or edited. If someone was
            there but forgot to clock in, add them under Attendance.
          </AlertDescription>
        </Alert>
      ) : null}

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

        Once the walk is completed, "on the walk" stops being true for
        anyone — the walk is over — so this section relabels itself to
        "Attended": these are the people who stayed for the whole thing
        without clocking out, not people still out there.
      */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {isCompleted ? "Attended" : "Attendance"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm tabular-nums text-muted-foreground">
              {isCompleted
                ? `${stillIn.length} stayed for the full walk · Click a row for details`
                : `${stillIn.length} on the walk · Click a row for details`}
            </span>
            {canAddAttendance ? (
              <AddAttendanceButton
                className="w-full sm:w-auto"
                walkCompleted={isCompleted}
                walkId={walk.id}
              />
            ) : null}
          </div>
        </div>

        {stillIn.length === 0 ? (
          <EmptyState
            description={
              walk.attendances.length === 0
                ? isCompleted
                  ? "Nobody clocked in for this walk. If someone was there, use Add someone."
                  : "Share the link above with the group."
                : isCompleted
                  ? "Everyone who clocked in also clocked out before the walk finished."
                  : "Everyone who clocked in has since clocked out."
            }
            icon={ClipboardList}
            title={
              walk.attendances.length === 0
                ? "Nobody has clocked in yet"
                : isCompleted
                  ? "Nobody stayed to the end"
                  : "Nobody is on the walk right now"
            }
          />
        ) : (
          <WalkAttendanceTable
            canRemove={!walk.cancelledAt}
            rows={stillIn.map(toAttendanceRow)}
            walkCompleted={isCompleted}
          />
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
          <WalkAttendanceTable
            canRemove={!walk.cancelledAt}
            rows={clockedOut.map(toAttendanceRow)}
            walkCompleted={isCompleted}
          />
        </section>
      ) : null}

      <Separator />

      <WalkJourneyManager
        canEdit={canEditJourney}
        defaultHappenedAt={journeyDefaultAt}
        events={journeyEvents}
        walkId={walk.id}
      />
    </div>
  );
}
