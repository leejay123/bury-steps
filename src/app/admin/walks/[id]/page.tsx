import { Suspense, type ReactNode } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { getSiteTheme } from "@/lib/site-theme";
import { getWalkDesigns, getWalkPageChoice } from "@/lib/walk-page-choice";
import { WalkDesignButton, WalkDesignProvider } from "@/components/walk-designer/design-button";
import { WalkDesignRender } from "@/components/walk-designer/render";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import WalkDetailLoading from "./loading";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAnyPermission, displayName } from "@/lib/auth";
import { utcToLondonWallClock } from "@/lib/dates";
import { WalkFacts } from "@/components/walk-facts";
import { walkStatus } from "@/lib/walk-window";
import { appUrl } from "@/lib/urls";
import { initials } from "@/lib/names";
import { ShareLinkButton } from "@/components/share-link";
import { WalkActionsBar } from "@/components/walk-manage-menu";
import { EmptyState } from "@/components/empty-state";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { WalkMapSection } from "@/components/walk-map-section";
import { HowWalksWork } from "@/components/how-walks-work";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { WalkShareWhileOpen } from "@/app/w/[token]/walk-share-status";
import { WalkForecastSection } from "@/components/walk-forecast";
import { meetingPointLabel } from "@/lib/geocode";
import { What3wordsLink } from "@/components/what3words-link";
import { walkShareUrl } from "@/lib/walk-slug";
import { ensureWalkSlug } from "@/lib/walk-slug-server";
import { RetentionLockToggle } from "./retention-lock-toggle";
import { AddSomeoneInManage, WalkAttendanceSection } from "./walk-attendance-section";
import { WalkCompletedNotice } from "./walk-completed-notice";
import { WalkDetailActions } from "./walk-detail-actions";
import { WalkDescription } from "@/components/walk-description";
import { WalkJourneyManager } from "./walk-journey";
import { SelfClockInPanel } from "./self-clock-in-panel";
import { WalkPageColumns } from "@/components/walk-page-columns";
import { WalkTabsLayout } from "@/components/walk-tabs-layout";
import { WalkGalleryLayouts } from "@/components/walk-gallery-layouts";
import { WalkStudioLayouts } from "@/components/walk-studio-layouts";
import { WalkIdeaLayouts, type WalkIdeaParts } from "@/components/walk-idea-layouts";
import { isWalkGalleryLayout, isWalkIdeaLayout, isWalkStudioLayout, isWalkTabsVariant, type WalkPageSectionId } from "@/lib/walk-page-sections";
import { SITE_SETTING_ID } from "@/lib/theme";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { WalkAttendanceRow } from "./walk-attendance";



/**
 * This walk's organiser page, as a private saved copy: kept in this browser
 * only for five minutes (never on the server), so it can be fetched ahead
 * (on hover or touch of its row, IntentLink) and open with no placeholder.
 * Any change to the walk, or a clock-in, refreshes it at once. The clock-in
 * box works from this device's clock, so a copy a few minutes old still
 * shows the right state. See node_modules/next/dist/docs/01-app/02-guides/
 * optimizing-prefetching.md.
 */
async function WalkDetailPageContent({ id }: { id: string }) {
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  // An organiser reaches this page either as a Walks-admin page in its own
  // right, or by clicking through from a member's walk history (a
  // Members-admin page) — either permission is enough to view it. Every
  // actual capability below (edit, cancel, delete, attendance, health
  // notes, journey, export, …) is now its own permission, checked
  // individually — see the nine permWalks* fields in organiser-permissions.ts.
  // The permission check and the walk are fetched at the same time (they
  // used to run one after the other, making this the slowest page to open).
  const [admin, walkWithNotes, emergencySetting, theme, choice, designs] = await Promise.all([
    requireAnyPermission(["permWalksView", "permMembersView"]),
    prisma.walk.findUnique({
    where: { id },
    select: {
      id: true,
      token: true,
      slug: true,
      title: true,
      description: true,
      distance: true,
      grade: true,
      elevationGain: true,
      essentials: true,
      walkLeader: true,
      backMarker: true,
      refreshmentStop: true,
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
          // Health notes are removed below for anyone without permission,
          // before anything is rendered or sent to the browser.
          conditions: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              emergencyContactName: true,
              emergencyContactPhone: true,
            },
          },
        },
      },
      journeyEvents: {
        orderBy: { happenedAt: "asc" },
        select: { id: true, title: true, body: true, happenedAt: true },
      },
    },
    }),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { emergencyContactRequired: true },
    }),
    getSiteTheme(),
    getWalkPageChoice(),
    getWalkDesigns(),
  ]);
  // Never keep health notes for a viewer who may not see them — UI-hiding
  // alone would still ship the text to their browser.
  const walk =
    walkWithNotes && !admin.permWalksHealth
      ? {
          ...walkWithNotes,
          attendances: walkWithNotes.attendances.map((attendance) => ({ ...attendance, conditions: null })),
        }
      : walkWithNotes;

  // A walk that's gone (just removed, or an old link) goes back to the
  // walks list. Removing a walk redraws this page before moving on, and a
  // "not found" page flashed up in between.
  if (!walk) redirect("/admin/walks");

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
        <Link href="/admin/walks" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; All walks
        </Link>
        <Alert variant="destructive">
          <AlertTitle>This walk has been cancelled</AlertTitle>
          <AlertDescription>
            {walk.cancelledReason || "Check with an organiser who has Walks access for details."}
          </AlertDescription>
        </Alert>
        <Card className="gap-4">
          <CardHeader>
            <h1 className="text-2xl leading-none font-semibold" data-slot="card-title">
              {walk.title}
            </h1>
          </CardHeader>
          <CardContent>
            <WalkFacts
              durationMins={walk.durationMins}
              location={walk.location}
              postcode={walk.postcode}
              startsAt={walk.startsAt}
            />
          </CardContent>
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
  const mine = attendances.find((a) => a.userId === admin.id);
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
      emergencyContactName: admin.permWalksAttendance
        ? (attendance.user.emergencyContactName ?? null)
        : null,
      emergencyContactPhone: admin.permWalksAttendance
        ? (attendance.user.emergencyContactPhone ?? null)
        : null,
    };
  }

  // The page's parts, placed by the walk page layout chosen in Settings →
  // Site wording → Walk page cards (one column, or two with tabs).
  const notices = (
    <>
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
      {walk.cancelledAt ? (
        <Alert variant="destructive">
          <AlertTitle>This walk has been cancelled</AlertTitle>
          <AlertDescription>
            {walk.cancelledReason ? `Reason: ${walk.cancelledReason.replace(/[.!?]+$/, "")}. ` : ""}
            Members can no longer clock in.
            {admin.permWalksCancel
              ? " Going ahead after all? Press Reopen walk."
              : admin.permWalksEdit
                ? " Going ahead after all? Press Edit and save."
                : ""}
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
  const detailsCard = (
    <>
      <Card className="gap-4">
        <CardHeader>
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            {/* Status label: beside the title from sm up; on phones it sits
                full width under "Created by" instead (see below). */}
            <div className="flex w-full min-w-0 items-center justify-between gap-4">
              {/* The page's one <h1> (CardTitle is a div). */}
              <h1 className="min-w-0 text-2xl leading-none font-semibold" data-slot="card-title">
                {walk.title}
              </h1>
              <WalkStatusBadge
                cancelledAt={walk.cancelledAt?.toISOString() ?? null}
                className="max-sm:hidden"
                durationMins={walk.durationMins}
                endedAt={walk.endedAt?.toISOString() ?? null}
                startsAt={walk.startsAt.toISOString()}
              />
            </div>
            {/* Organiser/owner-only — members never see who created a walk. */}
            <p className="text-xs text-muted-foreground">
              Created by {displayName(walk.createdBy)} ({creatorIsOwner ? "Owner" : "Organiser"})
            </p>
            <WalkStatusBadge
              cancelledAt={walk.cancelledAt?.toISOString() ?? null}
              className="mt-1 w-full justify-center py-1 sm:hidden"
              durationMins={walk.durationMins}
              endedAt={walk.endedAt?.toISOString() ?? null}
              startsAt={walk.startsAt.toISOString()}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <WalkFacts
            backMarker={walk.backMarker}
            refreshmentStop={walk.refreshmentStop}
            distance={walk.distance}
            durationMins={walk.durationMins}
            elevationGain={walk.elevationGain}
            essentials={walk.essentials}
            grade={walk.grade}
            location={walk.location}
            postcode={walk.postcode}
            startsAt={walk.startsAt}
            walkLeader={walk.walkLeader}
          />
          {walk.description ? <WalkDescription description={walk.description} /> : null}
        </CardContent>
      </Card>
    </>
  );
  const selfClockIn = (
    <>
      {walk.cancelledAt ? null : (
        <SelfClockInPanel
          alreadyClockedInAt={mine?.clockedInAt.toISOString() ?? null}
          clockedOutAt={mine?.clockedOutAt?.toISOString() ?? null}
          durationMins={walk.durationMins}
          emergencyContactName={admin.emergencyContactName ?? ""}
          emergencyContactPhone={admin.emergencyContactPhone ?? ""}
          emergencyContactRequired={emergencySetting?.emergencyContactRequired ?? false}
          endedAt={walk.endedAt?.toISOString() ?? null}
          startsAt={walk.startsAt.toISOString()}
          token={walk.token}
        />
      )}
    </>
  );
  // One of the shared sections, chosen and ordered in Settings → Site
  // wording → Walk page cards (Before you set off is members-only).
  function sectionPart(id: WalkPageSectionId) {
    if (!walk) return null; // never: redirect() above; tells TypeScript
    switch (id) {
      case "map":
        return meeting ? <WalkMapSection key={id} location={meeting} walk={walk} /> : null;
      case "forecast":
        return (
          <WalkForecastSection
            cancelledAt={walk.cancelledAt}
            durationMins={walk.durationMins}
            endedAt={walk.endedAt}
            key={id}
            latitude={walk.latitude}
            longitude={walk.longitude}
            place={meeting}
            startsAt={walk.startsAt}
          />
        );
      case "precise":
        return walk.what3words ? <What3wordsLink address={walk.what3words} key={id} /> : null;
      case "before":
        // Organisers and owners see the same tips as members, until the walk finishes.
        return walk.cancelledAt || !theme.beforeYouSetOffEnabled ? null : (
          <WalkShareWhileOpen
            cancelledAt={null}
            durationMins={walk.durationMins}
            endedAt={walk.endedAt?.toISOString() ?? null}
            key={id}
            startsAt={walk.startsAt.toISOString()}
          >
            <BeforeYouSetOff tips={theme.beforeYouSetOffTips} />
          </WalkShareWhileOpen>
        );
      default:
        return null;
    }
  }
  const shown = (id: WalkPageSectionId) => theme.walkPageSections.some((section) => section.id === id && section.visible);
  const sharedSections = <>{theme.walkPageSections.map(({ id, visible }) => (visible ? sectionPart(id) : null))}</>;
  const tools = (
    <>
      <WalkDetailActions
        attendanceCount={walk.attendances.length}
        backMarker={walk.backMarker}
        refreshmentStop={walk.refreshmentStop}
        cancelledAt={walk.cancelledAt?.toISOString() ?? null}
        canCancel={admin.permWalksCancel}
        canCreate={admin.permWalksCreate}
        canEdit={admin.permWalksEdit}
        canExportRoster={admin.permWalksExport}
        description={walk.description}
        distance={walk.distance}
        durationMins={walk.durationMins}
        endedAt={walk.endedAt?.toISOString() ?? null}
        elevationGain={walk.elevationGain}
        essentials={walk.essentials}
        grade={walk.grade}
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
        walkLeader={walk.walkLeader}
        what3words={walk.what3words}
      />
      {/* Add someone and Add event live here, not in their tabs. */}
      {admin.permWalksAttendance && canSeeAttendance ? (
        <AddSomeoneInManage
          cancelledAt={walk.cancelledAt?.toISOString() ?? null}
          durationMins={walk.durationMins}
          endedAt={walk.endedAt?.toISOString() ?? null}
          startsAt={walk.startsAt.toISOString()}
          walkId={walk.id}
        />
      ) : null}
      <WalkJourneyManager
        addOnly
        cancelledAt={walk.cancelledAt?.toISOString() ?? null}
        defaultHappenedAt={journeyDefaultAt}
        durationMins={walk.durationMins}
        endedAt={walk.endedAt?.toISOString() ?? null}
        events={journeyEvents}
        mayEdit={admin.permWalksJourney}
        startsAt={walk.startsAt.toISOString()}
        walkId={walk.id}
      />
      {walk.cancelledAt && admin.permWalksExport ? (
        <RetentionLockToggle locked={walk.retentionLocked} walkId={walk.id} />
      ) : null}
      {/* Anyone allowed to change the site's look: the walk page designer. */}
      {admin.permDisplay ? <WalkDesignButton /> : null}
    </>
  );
  // Every layout: one Manage button holding the share link and the walk's buttons.
  const manage = (
    <WalkActionsBar share={<ShareLinkButton url={walkShareUrl(appUrl(), { token: walk.token, slug })} />} tools={tools} />
  );
  const attendanceSection = canSeeAttendance ? (
    <>

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
        canSeeEmergencyContact={admin.permWalksAttendance}
        canSeeHealthNotes={admin.permWalksHealth}
        cancelledAt={walk.cancelledAt?.toISOString() ?? null}
        // In the list itself, under its header, rather than a box above it.
        conditionsNote={
          admin.permWalksHealth && withConditions > 0
            ? {
                title: `${withConditions} ${withConditions === 1 ? "member has" : "members have"} reported a condition`,
                text: "Read these before setting off. They are deleted 90 days after the walk.",
              }
            : null
        }
        clockedOutRows={clockedOut.map(toAttendanceRow)}
        durationMins={walk.durationMins}
        endedAt={walk.endedAt?.toISOString() ?? null}
        startsAt={walk.startsAt.toISOString()}
        stillInRows={stillIn.map(toAttendanceRow)}
        totalAttendanceCount={walk.attendances.length}
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
  );
  const journey = (
    <>
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
    </>
  );

  const shareUrl = walkShareUrl(appUrl(), { token: walk.token, slug });
  // The tabbed layouts and the 20 designs show the Clock in button on its own
  // (compact) in their buttons; the full panel then only says the rest.
  const clockIn = (compact: boolean, buttonElsewhere: boolean) =>
    walk.cancelledAt ? null : (
      <SelfClockInPanel
        alreadyClockedInAt={mine?.clockedInAt.toISOString() ?? null}
        buttonElsewhere={!compact && buttonElsewhere}
        clockedOutAt={mine?.clockedOutAt?.toISOString() ?? null}
        compact={compact}
        durationMins={walk.durationMins}
        emergencyContactName={admin.emergencyContactName ?? ""}
        emergencyContactPhone={admin.emergencyContactPhone ?? ""}
        emergencyContactRequired={emergencySetting?.emergencyContactRequired ?? false}
        endedAt={walk.endedAt?.toISOString() ?? null}
        startsAt={walk.startsAt.toISOString()}
        token={walk.token}
      />
    );
  const attendedTab = {
    // The count only for those who may see the list itself.
    label: canSeeAttendance ? `Attended (${walk.attendances.length})` : "Attended",
    count: canSeeAttendance ? walk.attendances.length : null,
    content: attendanceSection,
  };
  const factsCard = (
    <Card className="gap-4">
      <CardContent className="flex flex-col gap-4">
        <WalkFacts
          backMarker={walk.backMarker}
          refreshmentStop={walk.refreshmentStop}
          distance={walk.distance}
          durationMins={walk.durationMins}
          elevationGain={walk.elevationGain}
          essentials={walk.essentials}
          grade={walk.grade}
          location={walk.location}
          postcode={walk.postcode}
          startsAt={walk.startsAt}
          walkLeader={walk.walkLeader}
        />
        {walk.description ? <WalkDescription description={walk.description} /> : null}
      </CardContent>
    </Card>
  );
  const headlineData = {
    cancelledAt: walk.cancelledAt?.toISOString() ?? null,
    distance: walk.distance,
    durationMins: walk.durationMins,
    elevationGain: walk.elevationGain,
    endedAt: walk.endedAt?.toISOString() ?? null,
    grade: walk.grade,
    location: walk.location,
    // Organiser/owner-only — members never see who created a walk.
    note: `Created by ${displayName(walk.createdBy)} (${creatorIsOwner ? "Owner" : "Organiser"})`,
    postcode: walk.postcode,
    startsAt: walk.startsAt.toISOString(),
    title: walk.title,
    walkLeader: walk.walkLeader,
  };
  const timing = {
    cancelledAt: walk.cancelledAt?.toISOString() ?? null,
    durationMins: walk.durationMins,
    endedAt: walk.endedAt?.toISOString() ?? null,
    startsAt: walk.startsAt.toISOString(),
  };

  const ideaParts: WalkIdeaParts = {
    attended: attendedTab,
    before: shown("before") ? sectionPart("before") : null,
    details: factsCard,
    forecast: shown("forecast") ? sectionPart("forecast") : null,
    headline: headlineData,
    journey: { count: journeyEvents.length, content: journey },
    live: clockIn(false, true),
    liveCompact: clockIn(true, true),
    myClockIn: walk.cancelledAt ? null : (
      <SelfClockInPanel
        alreadyClockedInAt={mine?.clockedInAt.toISOString() ?? null}
        buttonElsewhere
        clockedOutAt={mine?.clockedOutAt?.toISOString() ?? null}
        durationMins={walk.durationMins}
        emergencyContactName={admin.emergencyContactName ?? ""}
        emergencyContactPhone={admin.emergencyContactPhone ?? ""}
        emergencyContactRequired={emergencySetting?.emergencyContactRequired ?? false}
        endedAt={walk.endedAt?.toISOString() ?? null}
        startsAt={walk.startsAt.toISOString()}
        statusOnly
        token={walk.token}
      />
    ),
    map: shown("map") ? sectionPart("map") : null,
    meeting,
    notices,
    precise: shown("precise") ? sectionPart("precise") : null,
    share: <ShareLinkButton url={shareUrl} />,
    timing,
    tips: theme.beforeYouSetOffTips,
    tools,
    back: { href: "/admin/walks", label: "All walks" },
    // For the walk page designer's signed-out visitor preview (hidden from
    // anyone signed in, as on the members' walk page).
    howItWorksSteps: theme.howWalksWorkSteps,
    howItWorks:
      walk.cancelledAt || !theme.howWalksWorkEnabled ? null : (
        <div className="contents" data-guest-home="">
          <HowWalksWork steps={theme.howWalksWorkSteps} />
        </div>
      ),
    what3words: walk.what3words,
    walk: {
      backMarker: walk.backMarker,
      refreshmentStop: walk.refreshmentStop,
      calendarHref: `/w/${slug}/ics`,
      description: walk.description,
      essentials: walk.essentials,
      location: walk.location,
      postcode: walk.postcode,
      shareUrl,
    },
  };
  const backRow = (
    <Link href="/admin/walks" className="w-fit text-sm text-muted-foreground hover:text-foreground">
      &larr; All walks
    </Link>
  );
  // Every layout: the page, with the walk handed to Design this page (in
  // the Manage list) for anyone allowed to change the site's look.
  const page = (content: ReactNode, { withBack = true }: { withBack?: boolean } = {}) => {
    const body = (
      <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
        {withBack ? backRow : null}
        {content}
      </div>
    );
    return admin.permDisplay ? (
      <WalkDesignProvider designs={designs} parts={ideaParts}>
        {body}
      </WalkDesignProvider>
    ) : (
      body
    );
  };

  if (choice.layout === "designed") {
    return page(
      <>
        <WalkDesignRender data={designs.organiser} parts={ideaParts} />
      </>,
      // Designed pages: the back link is the design's Back link block, if it has one.
      { withBack: false },
    );
  }

  if (isWalkIdeaLayout(choice.layout) || isWalkGalleryLayout(choice.layout) || isWalkStudioLayout(choice.layout)) {
    const layout = choice.layout;
    return page(
      <>
        {isWalkStudioLayout(layout) ? (
          <WalkStudioLayouts layout={layout} parts={ideaParts} />
        ) : isWalkGalleryLayout(layout) ? (
          <WalkGalleryLayouts layout={layout} parts={ideaParts} />
        ) : (
          <WalkIdeaLayouts layout={layout} parts={ideaParts} />
        )}
      </>,
    );
  }

  if (isWalkTabsVariant(choice.layout)) {
    const headerHasButton = choice.header !== "standard";
    return page(
      <>
        <WalkTabsLayout
          attended={attendedTab}
          details={factsCard}
          headerStyle={choice.header}
          headline={headlineData}
          journey={{ count: journeyEvents.length, content: journey }}
          live={clockIn(false, headerHasButton)}
          liveCompact={clockIn(true, headerHasButton)}
          meeting={meeting}
          notices={notices}
          sections={sharedSections}
          share={<ShareLinkButton url={shareUrl} />}
          timing={timing}
          tools={tools}
          variant={choice.layout}
          what3words={walk.what3words}
        />
      </>,
    );
  }

  if (choice.layout === "columns") {
    return page(
      <>
        {notices}
        <WalkPageColumns
          aside={
            <>
              {selfClockIn}
              {manage}
            </>
          }
          tabs={[
            { value: "route", label: "Map & weather", content: sharedSections },
            {
              value: "attended",
              // The count only for those who may see the list itself.
              label: canSeeAttendance ? `Attended (${walk.attendances.length})` : "Attended",
              content: attendanceSection,
            },
            { value: "journey", label: "Journey", content: journey },
          ]}
          top={detailsCard}
        />
      </>,
    );
  }

  return page(
    <>
      {notices}
      {detailsCard}
      {selfClockIn}
      {manage}
      {sharedSections}
      <Separator />
      {attendanceSection}
      <Separator />
      {journey}
    </>,
  );
}

/** Everything here depends on who's asking and on live data, so the page
 * shows a matching placeholder for an instant while it loads. */
/** The walk named in the address (fetched ahead with it, prefetch={true}). */
async function WalkDetailForAddress({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WalkDetailPageContent id={id} />;
}

/** Fetched ahead from its row in the Walks table, on hover or touch. */
export const prefetch = "partial";

export default function WalkDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<WalkDetailLoading />}>
      <PlaceholderPreview fallback={<WalkDetailLoading />}>
        <WalkDetailForAddress {...props} />
      </PlaceholderPreview>
    </Suspense>
  );
}
