import { WalkLinkLoading } from "./loading";
import { Suspense, cache } from "react";
import { cacheLife } from "next/cache";
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
import { walkStatus, windowState } from "@/lib/walk-window";
import { WalkMapSection } from "@/components/walk-map-section";
import { WalkForecastSection } from "@/components/walk-forecast";
import { SITE_SETTING_ID } from "@/lib/theme";
import { WalkJourneyDrawer } from "@/components/walk-journey-drawer";
import { WalkJourneyTimeline } from "@/components/walk-journey-timeline";
import { WalkPageColumns, type WalkPageTab } from "@/components/walk-page-columns";
import { WalkTabsLayout } from "@/components/walk-tabs-layout";
import { isWalkTabsVariant, type WalkPageSectionId } from "@/lib/walk-page-sections";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { HowWalksWork } from "@/components/how-walks-work";
import { getWalkMemberNames } from "@/lib/walk-members";
import { getSiteTheme } from "@/lib/site-theme";
import { WalkLivePanel } from "./walk-live-panel";
import {
  WalkClosedNoClockInNotice,
  WalkShareBeforeClockIn,
  WalkShareStatusChrome,
  WalkShareWhileOpen,
} from "./walk-share-status";
import { WalkLivePanelSkeleton } from "./walk-live-panel-skeleton";



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

/**
 * Fetched ahead from walk links (IntentLink, on hover or touch), so a walk
 * opens with its details already there. See node_modules/next/dist/docs/
 * 01-app/02-guides/optimizing-prefetching.md.
 */
export const prefetch = "partial";

/**
 * Recent and upcoming walks are made ahead of time, so opening one from a
 * shared link or refreshing it shows the walk at once; other walks are made
 * the first time someone opens them.
 */
export async function generateStaticParams(): Promise<{ token: string }[]> {
  try {
    const walks = await prisma.walk.findMany({
      where: { startsAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, slug: { not: null } },
      orderBy: { startsAt: "asc" },
      take: 60,
      select: { slug: true },
    });
    const tokens = walks.flatMap((walk) => (walk.slug ? [{ token: walk.slug }] : []));
    // Next.js needs at least one; this one shows "page not found".
    return tokens.length > 0 ? tokens : [{ token: "none-yet" }];
  } catch {
    return [{ token: "none-yet" }];
  }
}

/**
 * The walk's details, the same for everyone: a saved copy shared by every
 * server, refreshed whenever the walk changes (its page is refreshed, and
 * Next.js ties saved copies to the page that made them) and every five
 * minutes. Who you are, your clock-in and who's on the walk are not in it.
 */
async function getSharedWalk(token: string) {
  "use cache: remote";
  cacheLife({ revalidate: 300 });
  return getWalkByShareKey(token);
}

export default function WalkLinkPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<WalkLinkLoading />}>
      <WalkForAddress params={params} />
    </Suspense>
  );
}

async function WalkForAddress({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [walk, theme] = await Promise.all([getSharedWalk(token), getSiteTheme()]);
  if (!walk) notFound();

  // The code-only token link, a link from before a rename, or a walk with no
  // address name yet: send it to the walk's current address.
  if (token !== walk.slug) {
    const slug = await ensureWalkSlug(walk);
    if (token !== slug) redirect(`/w/${slug}`);
  }
  const slug = walk.slug ?? token;

  // Only what doesn't depend on the time is decided here: this part is
  // made ahead, and reading the clock would stop that. Whether the walk has
  // started or finished is worked out in the browser (the walk clocks) and
  // in the live part.
  const cancelled = walk.cancelledAt !== null;
  const walkUrl = walkShareUrl(appUrl(), { token: walk.token, slug });
  const meeting = meetingPointLabel(walk.location, walk.postcode);
  const journeyEvents = walk.journeyEvents.map((event) => ({
    id: event.id,
    title: event.title,
    body: event.body,
    happenedAt: event.happenedAt.toISOString(),
  }));
  const cancelledAtIso = walk.cancelledAt?.toISOString() ?? null;
  const endedAtIso = walk.endedAt?.toISOString() ?? null;
  const startsAtIso = walk.startsAt.toISOString();

  // One of the shared sections, chosen and ordered in Settings → Site
  // wording → Walk page cards (walk-page-sections.ts).
  function renderSection(id: WalkPageSectionId) {
    if (!walk) return null; // never: notFound() above; tells TypeScript
    switch (id) {
      case "before":
        if (cancelled || !theme.beforeYouSetOffEnabled) return null;
        // Members: until clock-in opens. Visitors: while the walk is open.
        // Both are drawn; the remembered sign-in hides the other.
        return (
          <div className="contents" key={id}>
            <div className="contents" data-member-home="">
              <WalkShareBeforeClockIn durationMins={walk.durationMins} endedAt={endedAtIso} startsAt={startsAtIso}>
                <BeforeYouSetOff tips={theme.beforeYouSetOffTips} />
              </WalkShareBeforeClockIn>
            </div>
            <div className="contents" data-guest-home="">
              <WalkShareWhileOpen
                cancelledAt={cancelledAtIso}
                durationMins={walk.durationMins}
                endedAt={endedAtIso}
                startsAt={startsAtIso}
              >
                <BeforeYouSetOff tips={theme.beforeYouSetOffTips} />
              </WalkShareWhileOpen>
            </div>
          </div>
        );
      case "map":
        // No directions to a walk that isn't happening.
        return meeting && !cancelled ? <WalkMapSection key={id} location={meeting} walk={walk} /> : null;
      case "forecast":
        // Hidden once the walk has finished — checked in the browser.
        return (
          <WalkShareWhileOpen
            cancelledAt={cancelledAtIso}
            durationMins={walk.durationMins}
            endedAt={endedAtIso}
            key={id}
            startsAt={startsAtIso}
          >
            <WalkForecastSection
              cancelledAt={walk.cancelledAt}
              durationMins={walk.durationMins}
              endedAt={walk.endedAt}
              latitude={walk.latitude}
              longitude={walk.longitude}
              place={meeting}
              startsAt={walk.startsAt}
              timeFree
            />
          </WalkShareWhileOpen>
        );
      case "precise":
        return walk.what3words ? <What3wordsLink address={walk.what3words} key={id} /> : null;
    }
    return null;
  }

  const chrome = (
    <>
      <WalkShareStatusChrome
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
        startsAt={startsAtIso}
        title={walk.title}
        walkLeader={walk.walkLeader}
        walkUrl={walkUrl}
      />
    </>
  );
  const live = (
    <>
      {/* What the member came to do (clock in, or their clock-in status) sits
          straight under the title card. Always live: never a saved copy. */}
      {cancelled ? null : (
        <Suspense
          fallback={
            <WalkLivePanelSkeleton durationMins={walk.durationMins} endedAt={endedAtIso} startsAt={startsAtIso} />
          }
        >
          <WalkLivePart
            beforeYouSetOffTips={theme.beforeYouSetOffTips}
            durationMins={walk.durationMins}
            endedAt={walk.endedAt}
            startsAt={walk.startsAt}
            token={walk.token}
            walkId={walk.id}
          />
        </Suspense>
      )}
    </>
  );
  const howWalksWork = (
    <>
      {/* Sign-up steps are for visitors; members have already done them. */}
      {cancelled || !theme.howWalksWorkEnabled ? null : (
        <div className="contents" data-guest-home="">
          <WalkShareWhileOpen
            cancelledAt={cancelledAtIso}
            durationMins={walk.durationMins}
            endedAt={endedAtIso}
            startsAt={startsAtIso}
          >
            <HowWalksWork steps={theme.howWalksWorkSteps} />
          </WalkShareWhileOpen>
        </div>
      )}
    </>
  );
  const visibleSections = theme.walkPageSections.filter(({ visible }) => visible);

  if (isWalkTabsVariant(theme.walkPageLayout)) {
    // The one-column tabbed layouts, the same as the organiser's walk page
    // (WalkTabsLayout). Visitors' How this group works and Before you set off
    // sit in Overview with the details.
    return (
      <div className="flex flex-col gap-6">
        <span className="text-sm text-muted-foreground">
          <Link className="hover:text-foreground" data-member-home="" href="/walks">
            ← Walks
          </Link>
          <Link className="hover:text-foreground" data-guest-home="" href="/">
            ← Home
          </Link>
        </span>
        <WalkTabsLayout
          attended={null}
          details={
            <>
              <WalkShareStatusChrome
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
                startsAt={startsAtIso}
                title={walk.title}
                walkLeader={walk.walkLeader}
                walkUrl={walkUrl}
                part="details"
              />
              {howWalksWork}
              {visibleSections.some(({ id }) => id === "before") ? renderSection("before") : null}
            </>
          }
          headerStyle={theme.walkHeaderStyle}
          headline={{
            cancelledAt: cancelledAtIso,
            distance: walk.distance,
            elevationGain: walk.elevationGain,
            durationMins: walk.durationMins,
            endedAt: endedAtIso,
            grade: walk.grade,
            location: walk.location,
            postcode: walk.postcode,
            startsAt: startsAtIso,
            title: walk.title,
            walkLeader: walk.walkLeader,
          }}
          journey={
            journeyEvents.length > 0
              ? { count: journeyEvents.length, content: <WalkJourneyTimeline events={journeyEvents} /> }
              : null
          }
          live={live}
          meeting={meeting}
          notices={
            <WalkShareStatusChrome
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
              startsAt={startsAtIso}
              title={walk.title}
              walkLeader={walk.walkLeader}
              walkUrl={walkUrl}
              part="notices"
            />
          }
          sections={visibleSections.filter(({ id }) => id !== "before").map(({ id }) => renderSection(id))}
          timing={{ cancelledAt: cancelledAtIso, durationMins: walk.durationMins, endedAt: endedAtIso, startsAt: startsAtIso }}
          variant={theme.walkPageLayout}
          what3words={walk.what3words}
        />
      </div>
    );
  }

  if (theme.walkPageLayout === "columns") {
    // The same layout as the organiser's walk page (WalkPageColumns): the
    // details and sections on the left, clock-in in the column on the right.
    // Before you set off sits with clock-in; the Journey is a tab.
    const tabs: WalkPageTab[] = [
      {
        value: "route",
        label: "Map & weather",
        content: visibleSections.filter(({ id }) => id !== "before").map(({ id }) => renderSection(id)),
      },
    ];
    if (journeyEvents.length > 0) {
      tabs.push({ value: "journey", label: "Journey", content: <WalkJourneyTimeline events={journeyEvents} /> });
    }
    return (
      <div className="flex flex-col gap-6">
        <span className="text-sm text-muted-foreground">
          {/* Members go back to Walks, everyone else Home: both are here, and
              the remembered sign-in shows the right one before anything is drawn. */}
          <Link className="hover:text-foreground" data-member-home="" href="/walks">
            ← Walks
          </Link>
          <Link className="hover:text-foreground" data-guest-home="" href="/">
            ← Home
          </Link>
        </span>
        <WalkPageColumns
          aside={
            <>
              {live}
              {howWalksWork}
              {visibleSections.some(({ id }) => id === "before") ? renderSection("before") : null}
            </>
          }
          tabs={tabs}
          top={chrome}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {/* Members go back to Walks, everyone else Home: both are here, and
              the remembered sign-in shows the right one before anything is drawn. */}
          <Link className="hover:text-foreground" data-member-home="" href="/walks">
            ← Walks
          </Link>
          <Link className="hover:text-foreground" data-guest-home="" href="/">
            ← Home
          </Link>
        </span>
        <WalkJourneyDrawer events={journeyEvents} />
      </div>
      {chrome}
      {live}
      {howWalksWork}
      {visibleSections.map(({ id }) => renderSection(id))}
    </div>
  );
}

/**
 * The signed-in member's part of the walk page — clock in, their clock-in
 * status, who's on the walk — and, after a walk they missed, who to speak
 * to. Worked out fresh on every visit (no saved copy), so it's always up to
 * the second. Nothing for visitors.
 */
async function WalkLivePart({
  beforeYouSetOffTips,
  durationMins,
  endedAt,
  startsAt,
  token,
  walkId,
}: {
  beforeYouSetOffTips: readonly string[];
  durationMins: number;
  endedAt: Date | null;
  startsAt: Date;
  token: string;
  walkId: string;
}) {
  const user = await getOptionalUser();
  if (!user) return null;
  const status = walkStatus({ cancelledAt: null, durationMins, endedAt, startsAt });

  const [emergencySetting, myAttendance] = await Promise.all([
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { emergencyContactRequired: true },
    }),
    prisma.attendance.findFirst({
      where: { walkId, userId: user.id },
      select: { clockedInAt: true, clockedOutAt: true },
    }),
  ]);
  const attended = Boolean(myAttendance);

  // Names only once this member has clocked in — privacy for guests and
  // people who have not joined yet. Organisers and owners always see who's
  // on the walk, clocked in or not. WalkMembers paginates at 20, so a
  // thousand names on one walk stay usable. Clocking out does not revoke
  // that — they were on the walk.
  const organiserView = user.role === "ADMIN";
  const memberNames =
    attended || organiserView ? await getWalkMemberNames(walkId, { finished: status === "completed" }) : [];
  const closedNoClockIn = !attended && windowState(startsAt, durationMins, new Date(), endedAt) === "closed";

  return (
    <>
      {closedNoClockIn ? <WalkClosedNoClockInNotice /> : null}
      <WalkLivePanel
        alreadyClockedInAt={myAttendance?.clockedInAt.toISOString() ?? null}
        // Before you set off is placed by the walk page layout.
        beforeYouSetOffEnabled={false}
        beforeYouSetOffTips={beforeYouSetOffTips}
        clockedOutAt={myAttendance?.clockedOutAt?.toISOString() ?? null}
        durationMins={durationMins}
        emergencyContactName={user.emergencyContactName ?? ""}
        emergencyContactPhone={user.emergencyContactPhone ?? ""}
        emergencyContactRequired={emergencySetting?.emergencyContactRequired ?? false}
        endedAt={endedAt?.toISOString() ?? null}
        memberNames={memberNames}
        organiserView={organiserView}
        startsAt={startsAt.toISOString()}
        token={token}
        walksHref={organiserView ? "/admin/walks" : "/walks"}
      />
    </>
  );
}
