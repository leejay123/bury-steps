import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, CalendarPlus, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAnyPermission, displayName } from "@/lib/auth";
import { isOwner } from "@/lib/site-owner";
import { formatWalkDate, utcToLondonWallClock } from "@/lib/dates";
import { canOrganiserAddAttendance, canOrganiserEditJourney, canAddWalkToCalendar, isWalkScheduleLocked, walkStatus } from "@/lib/walk-window";
import { appUrl } from "@/lib/urls";
import { initials } from "@/lib/names";
import { ShareLink } from "@/components/share-link";
import { EmptyState } from "@/components/empty-state";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { WalkMapSection } from "@/components/walk-map-section";
import { meetingPointLabel } from "@/lib/geocode";
import { What3wordsLink } from "@/components/what3words-link";
import { walkShareUrl } from "@/lib/walk-slug";
import { ensureWalkSlug } from "@/lib/walk-slug-server";
import { CancelWalkButton } from "./cancel-walk-button";
import { DuplicateWalkButton } from "./duplicate-walk-button";
import { EditWalkButton } from "./edit-walk-button";
import { EndWalkButton } from "./end-walk-button";
import { AddAttendanceButton } from "./add-attendance-button";
import { ReopenWalkButton } from "./reopen-walk-button";
import { RetentionLockToggle } from "./retention-lock-toggle";
import { DeleteWalkButton } from "./delete-walk-button";
import { WalkJourneyManager } from "./walk-journey";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WalkAttendanceTable, type WalkAttendanceRow } from "./walk-attendance";

export const dynamic = "force-dynamic";

export default async function WalkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // An organiser reaches this page either as a Walks-admin page in its own
  // right, or by clicking through from a member's walk history (a
  // Members-admin page) — either permission is enough to view it. The
  // action buttons below (Edit, Cancel, End, Add attendance, …) still each
  // independently require permWalks specifically when actually used.
  const admin = await requireAnyPermission(["permWalks", "permMembers"]);
  // Gates every actual walk-management control below (edit, cancel, end,
  // delete, duplicate, add/remove attendance, journey events, retention
  // lock, the roster export) — someone here only via permMembers can view
  // everything on the page but shouldn't see buttons that would just get
  // refused when clicked.
  const canManageWalks = admin.permWalks;
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
      what3words: true,
      startsAt: true,
      durationMins: true,
      endedAt: true,
      cancelledAt: true,
      cancelledReason: true,
      retentionLocked: true,
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

  // A cancelled walk's full admin view stays owner/Walks-permission
  // territory even for someone here via Members access — but this isn't a
  // "page doesn't exist" situation (they got here from a real link, e.g.
  // a member's own walk history — see the greyed-out row in
  // src/app/admin/members/[id]/page.tsx), so it's honest about what
  // happened rather than a bare 404.
  if (walk.cancelledAt && !canManageWalks && !(await isOwner(admin.id))) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; All walks
        </Link>
        <Alert variant="destructive">
          <AlertTitle>This walk has been cancelled</AlertTitle>
          <AlertDescription>
            {walk.cancelledReason || "Check with an organiser who has Walks access for details."}
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader className="flex flex-col gap-1.5">
            <CardTitle className="text-2xl">{walk.title}</CardTitle>
            <CardDescription>
              {formatWalkDate(walk.startsAt)} · {walk.durationMins} min
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const slug = await ensureWalkSlug(walk);
  const meeting = meetingPointLabel(walk.location, walk.postcode);
  const attendances = walk.attendances;
  const stillIn = attendances.filter((a) => !a.clockedOutAt);
  const clockedOut = attendances.filter((a) => a.clockedOutAt);
  const withConditions = attendances.filter((a) => a.conditions).length;
  // Same rule the public walk page already applies to an ordinary member
  // (see getWalkMemberNames in src/app/w/[token]/page.tsx: names only show
  // once *you've* clocked into that walk) — an organiser here only via
  // Members access sees the attendee list the same way a member would,
  // not the full roster just because they can open the page.
  const viewerAttended = attendances.some((a) => a.userId === admin.id);
  const canSeeAttendance = canManageWalks || viewerAttended;
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

      {/* Only tells someone what THEY can still do about it — an
          organiser without Walks access can't cancel, edit, or add a
          forgotten clock-in either, so this stays silent for them rather
          than describing tools they don't have (the status badge above
          already says "Completed"). */}
      {isCompleted && canManageWalks ? (
        <Alert variant="info">
          <AlertDescription>
            This walk has finished, so it can no longer be cancelled or edited. If someone was
            there but forgot to clock in, add them under Attendance.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-1.5">
          <CardTitle className="text-2xl">{walk.title}</CardTitle>
          <CardDescription>
            {formatWalkDate(walk.startsAt)}
            {meeting ? ` · ${meeting}` : ""} · {walk.durationMins} min
          </CardDescription>
          {/* Below the schedule line, not beside the title — the countdown
              ("In progress · 23 min left") reads as a comment on how much
              of that length is left, not as a label for the walk itself. */}
          <div>
            <WalkStatusBadge
              cancelledAt={walk.cancelledAt?.toISOString() ?? null}
              durationMins={walk.durationMins}
              endedAt={walk.endedAt?.toISOString() ?? null}
              startsAt={walk.startsAt.toISOString()}
            />
          </div>
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

      {walk.what3words ? <What3wordsLink address={walk.what3words} /> : null}

      <div className="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [-ms-overflow-style:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden [&>*]:shrink-0">
        {showCalendar ? (
          <Button asChild size="sm" variant="outline">
            <a download href={`/w/${slug}/ics`}>
              <CalendarPlus data-icon="inline-start" />
              Add to calendar
            </a>
          </Button>
        ) : null}
        {canManageWalks ? (
          <>
            <Button asChild size="sm" variant="outline">
              <a href={`/admin/walks/${walk.id}/export`}>
                <Download data-icon="inline-start" />
                Download roster (CSV)
              </a>
            </Button>
            <DuplicateWalkButton walkId={walk.id} />
            {/*
              Cancel only ever applies to a walk that hasn't started yet —
              "cancelled" means it never happened, which stops being true the
              moment people are out on it. Once it's in progress, End walk is
              the equivalent action instead (marks it finished early rather
              than un-happening it); once it's completed, neither applies.
            */}
            {!walk.cancelledAt && (status === "upcoming" || status === "starting-soon") && (
              <CancelWalkButton walkId={walk.id} attendanceCount={stillIn.length} />
            )}
            {/* Only makes sense while the walk is actually under way — before
                that there's nothing to cut short, and after it's already
                completed (naturally or via this same button) there's nothing
                left to end. */}
            {status === "in-progress" && <EndWalkButton walkId={walk.id} />}
            {/*
              Edit for a completed walk would silently rewrite history rather
              than change a plan, so it stays hidden the moment the clock-in
              window has fully closed; Delete and the CSV export remain below,
              since a completed walk is still a real record that might need
              correcting or removing.
            */}
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
                what3words={walk.what3words}
              />
            )}
            {walk.cancelledAt ? <ReopenWalkButton walkId={walk.id} /> : null}
            <DeleteWalkButton walkId={walk.id} attendanceCount={walk.attendances.length} />
          </>
        ) : null}
      </div>

      {walk.cancelledAt && canManageWalks ? (
        <RetentionLockToggle locked={walk.retentionLocked} walkId={walk.id} />
      ) : null}

      <Separator />

      {canSeeAttendance ? (
        <>
          {withConditions > 0 && (
            <Alert variant="warning">
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
            {canAddAttendance && canManageWalks ? (
              <div className="flex justify-end">
                <AddAttendanceButton
                  className="w-full sm:w-auto"
                  walkCompleted={isCompleted}
                  walkId={walk.id}
                />
              </div>
            ) : null}

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
                canRemove={!walk.cancelledAt && canManageWalks}
                heading={{ count: stillIn.length, label: isCompleted ? "Attended" : "Attendance" }}
                rows={stillIn.map(toAttendanceRow)}
                walkCompleted={isCompleted}
              />
            )}
          </section>

          {clockedOut.length > 0 ? (
            <section className="flex flex-col gap-3">
              <WalkAttendanceTable
                canRemove={!walk.cancelledAt && canManageWalks}
                heading={{ count: clockedOut.length, label: "Clocked out" }}
                rows={clockedOut.map(toAttendanceRow)}
                walkCompleted={isCompleted}
              />
            </section>
          ) : null}
        </>
      ) : (
        // Same boundary the public walk page draws for an ordinary member
        // (see viewerAttended above) — reached this page via Members
        // access only, and never clocked into this particular walk.
        <EmptyState
          description="You'll see who's on this walk once you've clocked into it yourself, or if you're given the Walks permission."
          icon={ClipboardList}
          title="Attendance is private to this walk"
        />
      )}

      <Separator />

      <WalkJourneyManager
        canEdit={canEditJourney && canManageWalks}
        defaultHappenedAt={journeyDefaultAt}
        events={journeyEvents}
        walkId={walk.id}
      />
    </div>
  );
}
