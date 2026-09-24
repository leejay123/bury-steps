import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAnyPermission, displayName } from "@/lib/auth";
import { formatWalkDate, utcToLondonWallClock } from "@/lib/dates";
import { walkStatus } from "@/lib/walk-window";
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
import { RetentionLockToggle } from "./retention-lock-toggle";
import { WalkAttendanceSection } from "./walk-attendance-section";
import { WalkCompletedNotice } from "./walk-completed-notice";
import { WalkDetailActions } from "./walk-detail-actions";
import { WalkJourneyManager } from "./walk-journey";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { WalkAttendanceRow } from "./walk-attendance";

export const dynamic = "force-dynamic";

export default async function WalkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // An organiser reaches this page either as a Walks-admin page in its own
  // right, or by clicking through from a member's walk history (a
  // Members-admin page) — either permission is enough to view it. Every
  // actual capability below (edit, cancel, delete, attendance, health
  // notes, journey, export, …) is now its own permission, checked
  // individually — see the nine permWalks* fields in organiser-permissions.ts.
  const admin = await requireAnyPermission(["permWalksView", "permMembersView"]);
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
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true, isOwner: true } },
      attendances: {
        orderBy: [{ clockedOutAt: "asc" }, { clockedInAt: "asc" }],
        select: {
          id: true,
          userId: true,
          clockedInAt: true,
          clockedOutAt: true,
          clockedOutReason: true,
          // Never select health notes unless this viewer may see them —
          // UI-hiding alone still ships the text in the RSC payload.
          ...(admin.permWalksHealth ? { conditions: true } : {}),
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      journeyEvents: {
        orderBy: { happenedAt: "asc" },
        select: { id: true, title: true, body: true, happenedAt: true },
      },
    },
  });

  if (!walk) notFound();

  const viewerIsOwner = admin.isOwner;
  const creatorIsOwner = walk.createdBy.isOwner;

  // A cancelled walk's full admin view stays owner/View-permission
  // territory even for someone here via Members access — but this isn't a
  // "page doesn't exist" situation (they got here from a real link, e.g.
  // a member's own walk history — see the greyed-out row in
  // src/app/admin/members/[id]/page.tsx), so it's honest about what
  // happened rather than a bare 404.
  if (walk.cancelledAt && !admin.permWalksView && !viewerIsOwner) {
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
  const withConditions = admin.permWalksHealth
    ? attendances.filter((a) => "conditions" in a && a.conditions).length
    : 0;
  // Same rule the public walk page already applies to an ordinary member
  // (see getWalkMemberNames in src/app/w/[token]/page.tsx: names only show
  // once *you've* clocked into that walk) — an organiser here only via
  // Members access sees the attendee list the same way a member would,
  // not the full roster just because they can open the page.
  const viewerAttended = attendances.some((a) => a.userId === admin.id);
  const canSeeAttendance = admin.permWalksAttendance || viewerAttended;
  const status = walkStatus(walk);
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
      conditions: admin.permWalksHealth
        ? ("conditions" in attendance ? (attendance.conditions ?? null) : null)
        : null,
    };
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; All walks
      </Link>

      {/* Only tells someone what THEY can still do about it — an
          organiser without any of Edit/Cancel/Attendance can't act on any
          of what this mentions, so it stays silent for them rather than
          describing tools they don't have (the status badge above already
          says "Completed"). Live with the walk clock so a page left open
          still picks up the finished state. */}
      <WalkCompletedNotice
        cancelledAt={walk.cancelledAt?.toISOString() ?? null}
        durationMins={walk.durationMins}
        endedAt={walk.endedAt?.toISOString() ?? null}
        show={admin.permWalksEdit || admin.permWalksCancel || admin.permWalksAttendance}
        startsAt={walk.startsAt.toISOString()}
      />

      <Card>
        <CardHeader className="flex flex-col gap-1.5">
          <CardTitle className="text-2xl">{walk.title}</CardTitle>
          <CardDescription>
            {formatWalkDate(walk.startsAt)}
            {meeting ? ` · ${meeting}` : ""} · {walk.durationMins} min
          </CardDescription>
          {/* Organiser/owner-only — members never see who created a walk. */}
          <p className="text-xs text-muted-foreground">
            Created by {displayName(walk.createdBy)} ({creatorIsOwner ? "Owner" : "Organiser"})
          </p>
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

      <WalkDetailActions
        attendanceCount={walk.attendances.length}
        cancelledAt={walk.cancelledAt?.toISOString() ?? null}
        canCancel={admin.permWalksCancel}
        canCreate={admin.permWalksCreate}
        canEdit={admin.permWalksEdit}
        canExportRoster={admin.permWalksExport && admin.permWalksHealth}
        description={walk.description}
        durationMins={walk.durationMins}
        endedAt={walk.endedAt?.toISOString() ?? null}
        icsHref={`/w/${slug}/ics`}
        latitude={walk.latitude}
        location={walk.location}
        longitude={walk.longitude}
        postcode={walk.postcode}
        rosterHref={`/admin/walks/${walk.id}/export`}
        startsAt={walk.startsAt.toISOString()}
        title={walk.title}
        totalAttendanceCount={walk.attendances.length}
        viewerIsOwner={viewerIsOwner}
        walkId={walk.id}
        what3words={walk.what3words}
      />

      {walk.cancelledAt && admin.permWalksExport ? (
        <RetentionLockToggle locked={walk.retentionLocked} walkId={walk.id} />
      ) : null}

      <Separator />

      {canSeeAttendance ? (
        <>
          {admin.permWalksHealth && withConditions > 0 && (
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
            without clocking out, not people still out there. Labels and Add
            someone tick with the walk clock (see WalkAttendanceSection).
          */}
          <WalkAttendanceSection
            canManageAttendance={admin.permWalksAttendance}
            canSeeHealthNotes={admin.permWalksHealth}
            cancelledAt={walk.cancelledAt?.toISOString() ?? null}
            clockedOutRows={clockedOut.map(toAttendanceRow)}
            durationMins={walk.durationMins}
            endedAt={walk.endedAt?.toISOString() ?? null}
            startsAt={walk.startsAt.toISOString()}
            stillInRows={stillIn.map(toAttendanceRow)}
            totalAttendanceCount={walk.attendances.length}
            walkId={walk.id}
          />
        </>
      ) : (
        // Same boundary the public walk page draws for an ordinary member
        // (see viewerAttended above) — reached this page via Members
        // access only, and never clocked into this particular walk.
        <EmptyState
          description="You'll see who's on this walk once you've clocked into it yourself, or if you're given the Attendance permission."
          icon={ClipboardList}
          title="Attendance is private to this walk"
        />
      )}

      <Separator />

      <WalkJourneyManager
        cancelledAt={walk.cancelledAt?.toISOString() ?? null}
        defaultHappenedAt={journeyDefaultAt}
        durationMins={walk.durationMins}
        endedAt={walk.endedAt?.toISOString() ?? null}
        events={journeyEvents}
        mayEdit={admin.permWalksJourney}
        startsAt={walk.startsAt.toISOString()}
        walkId={walk.id}
      />
    </div>
  );
}
