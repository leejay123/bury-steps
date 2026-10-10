import WalkLinkLoading from "./loading";
import { holdForPreview, placeholderPreviewMode } from "@/lib/placeholder-preview";
import { cache } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getOptionalUser } from "@/lib/auth";
import { formatWalkDate } from "@/lib/dates";
import { appUrl } from "@/lib/urls";
import { meetingPointLabel } from "@/lib/geocode";
import { What3wordsLink } from "@/components/what3words-link";
import { walkShareUrl } from "@/lib/walk-slug";
import { ensureWalkSlug, findWalkIdBySlugCode } from "@/lib/walk-slug-server";
import { walkStatus } from "@/lib/walk-window";
import { WalkMapSection } from "@/components/walk-map-section";
import { WalkForecastSection } from "@/components/walk-forecast";
import { SITE_SETTING_ID } from "@/lib/theme";
import { WalkJourneyDrawer } from "@/components/walk-journey-drawer";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { HowWalksWork } from "@/components/how-walks-work";
import { getWalkMemberNames } from "@/lib/walk-members";
import { getSiteTheme } from "@/lib/site-theme";
import { WalkLivePanel } from "./walk-live-panel";
import { WalkShareBeforeClockIn, WalkShareStatusChrome, WalkShareWhileOpen } from "./walk-share-status";



const WALK_PAGE_SELECT = {
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
  journeyEvents: {
    orderBy: { happenedAt: "asc" },
    select: { id: true, title: true, body: true, happenedAt: true },
  },
} satisfies Prisma.WalkSelect;

// Cached per request so generateMetadata and the page body share one lookup.
const getWalkByShareKey = cache(async (key: string) => {
  const walk = await prisma.walk.findFirst({
    where: { OR: [{ token: key }, { slug: key }] },
    select: WALK_PAGE_SELECT,
  });
  if (walk) return walk;
  // A link posted before the walk was renamed: older place word, same code.
  const id = await findWalkIdBySlugCode(key);
  return id ? prisma.walk.findUnique({ where: { id }, select: WALK_PAGE_SELECT }) : null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const walk = await getWalkByShareKey(token);
  if (!walk) return { title: "Walk not found" };

  const status = walkStatus({
    cancelledAt: walk.cancelledAt,
    durationMins: walk.durationMins,
    endedAt: walk.endedAt,
    startsAt: walk.startsAt,
  });

  const when = formatWalkDate(walk.startsAt);
  const meeting = meetingPointLabel(walk.location, walk.postcode);
  const title = status === "cancelled" ? `Cancelled: ${walk.title}` : walk.title;
  const description =
    status === "cancelled"
      ? `Cancelled. Was ${when}${meeting ? ` at ${meeting}` : ""}.`
      : status === "completed"
        ? `${when}${meeting ? ` · ${meeting}` : ""}. This walk has finished.`
        : `${when}${meeting ? ` · ${meeting}` : ""}. Tap to see details and clock in.`;

  return {
    title,
    description,
    // One-off share links — not meant to show up in search.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function WalkLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Temporary owner tool: show this page's placeholder instead (loading.tsx).
  const preview = await placeholderPreviewMode();
  if (preview === "always") return <WalkLinkLoading />;
  if (preview === "hold") await holdForPreview();
  const { token } = await params;
  const walk = await getWalkByShareKey(token);
  if (!walk) notFound();

  const [user, theme, emergencySetting] = await Promise.all([
    getOptionalUser(),
    getSiteTheme(),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { emergencyContactRequired: true },
    }),
  ]);
  const status = walkStatus({
    cancelledAt: walk.cancelledAt,
    durationMins: walk.durationMins,
    endedAt: walk.endedAt,
    startsAt: walk.startsAt,
  });

  // A cancelled walk is viewable by anyone, same as a completed one — the
  // member-facing "All walks" tab lists and links to cancelled walks
  // alongside completed ones, so this page must not 404 for them. There's
  // nothing sensitive to protect either way: WalkLivePanel (clock-in,
  // attendee names) never renders for a cancelled walk regardless of who's
  // looking.
  const slug = await ensureWalkSlug(walk);
  // The code-only token link, or a link from before a rename: send it to
  // the walk's current address.
  if (token !== slug) {
    redirect(`/w/${slug}`);
  }

  const walkUrl = walkShareUrl(appUrl(), { token: walk.token, slug });

  const myAttendance = user
    ? await prisma.attendance.findFirst({
        where: { walkId: walk.id, userId: user.id },
        select: { clockedInAt: true, clockedOutAt: true },
      })
    : null;
  const attended = Boolean(myAttendance);

  // Names only once this member has clocked in — privacy for guests and
  // people who have not joined yet. WalkMembers paginates at 20, so a
  // thousand names on one walk stay usable. Clocking out does not revoke
  // that — they were on the walk.
  const memberNames = attended
    ? await getWalkMemberNames(walk.id, { finished: status === "completed" })
    : [];
  const meeting = meetingPointLabel(walk.location, walk.postcode);
  const walksHref = user?.role === "ADMIN" ? "/admin/walks" : "/walks";
  const journeyEvents = walk.journeyEvents.map((event) => ({
    id: event.id,
    title: event.title,
    body: event.body,
    happenedAt: event.happenedAt.toISOString(),
  }));
  const cancelledAtIso = walk.cancelledAt?.toISOString() ?? null;
  const endedAtIso = walk.endedAt?.toISOString() ?? null;
  const startsAtIso = walk.startsAt.toISOString();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href={user ? walksHref : "/"}
        >
          ← {user ? "Walks" : "Home"}
        </Link>
        <WalkJourneyDrawer events={journeyEvents} />
      </div>

      <WalkShareStatusChrome
        attended={attended}
        backMarker={walk.backMarker}
        cancelledAt={cancelledAtIso}
        cancelledReason={walk.cancelledReason}
        description={walk.description}
        distance={walk.distance}
        durationMins={walk.durationMins}
        endedAt={endedAtIso}
        elevationGain={walk.elevationGain}
        essentials={walk.essentials}
        grade={walk.grade}
        icsHref={`/w/${slug}/ics`}
        location={walk.location}
        postcode={walk.postcode}
        signedIn={Boolean(user)}
        startsAt={startsAtIso}
        title={walk.title}
        walkLeader={walk.walkLeader}
        walkUrl={walkUrl}
      />

      {/* What the member came to do (clock in, or their clock-in status) sits
          straight under the title card, above the map and forecast. */}
      {status === "cancelled" || !user ? null : (
        <WalkLivePanel
          alreadyClockedInAt={myAttendance?.clockedInAt.toISOString() ?? null}
          // Before you set off is placed by the walk page layout below.
          beforeYouSetOffEnabled={false}
          beforeYouSetOffTips={theme.beforeYouSetOffTips}
          clockedOutAt={myAttendance?.clockedOutAt?.toISOString() ?? null}
          durationMins={walk.durationMins}
          emergencyContactName={user.emergencyContactName ?? ""}
          emergencyContactPhone={user.emergencyContactPhone ?? ""}
          emergencyContactRequired={emergencySetting?.emergencyContactRequired ?? false}
          endedAt={endedAtIso}
          memberNames={memberNames}
          startsAt={startsAtIso}
          token={walk.token}
          walksHref={walksHref}
        />
      )}

      {/* Sign-up steps are for visitors; members have already done them. */}
      {status === "cancelled" || user || !theme.howWalksWorkEnabled ? null : (
        <WalkShareWhileOpen
          cancelledAt={cancelledAtIso}
          durationMins={walk.durationMins}
          endedAt={endedAtIso}
          startsAt={startsAtIso}
        >
          <HowWalksWork steps={theme.howWalksWorkSteps} />
        </WalkShareWhileOpen>
      )}

      {/* The shared sections, in the order and with the show/hide chosen in
          Settings → Site wording → Walk page cards (walk-page-sections.ts). */}
      {theme.walkPageSections.map(({ id, visible }) => {
        if (!visible) return null;
        switch (id) {
          case "before":
            // Visitors: while the walk is open. Members: until clock-in
            // opens (as when it sat in the clock-in panel).
            if (status === "cancelled" || !theme.beforeYouSetOffEnabled) return null;
            return user ? (
              <WalkShareBeforeClockIn
                durationMins={walk.durationMins}
                endedAt={endedAtIso}
                key={id}
                startsAt={startsAtIso}
              >
                <BeforeYouSetOff tips={theme.beforeYouSetOffTips} />
              </WalkShareBeforeClockIn>
            ) : (
              <WalkShareWhileOpen
                cancelledAt={cancelledAtIso}
                durationMins={walk.durationMins}
                endedAt={endedAtIso}
                key={id}
                startsAt={startsAtIso}
              >
                <BeforeYouSetOff tips={theme.beforeYouSetOffTips} />
              </WalkShareWhileOpen>
            );
          case "map":
            // No directions to a walk that isn't happening.
            return meeting && status !== "cancelled" ? <WalkMapSection key={id} location={meeting} walk={walk} /> : null;
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
        }
      })}
    </div>
  );
}
