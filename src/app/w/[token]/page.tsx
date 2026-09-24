import { cache } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getOptionalUser } from "@/lib/auth";
import { formatWalkDate } from "@/lib/dates";
import { appUrl } from "@/lib/urls";
import { meetingPointLabel } from "@/lib/geocode";
import { What3wordsLink } from "@/components/what3words-link";
import { walkShareUrl } from "@/lib/walk-slug";
import { ensureWalkSlug } from "@/lib/walk-slug-server";
import { walkStatus } from "@/lib/walk-window";
import { WalkMapSection } from "@/components/walk-map-section";
import { WalkJourneyDrawer } from "@/components/walk-journey-drawer";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { HowWalksWork } from "@/components/how-walks-work";
import { getWalkMemberNames } from "@/lib/walk-members";
import { getSiteTheme } from "@/lib/site-theme";
import { WalkLivePanel } from "./walk-live-panel";
import { WalkShareStatusChrome, WalkShareWhileOpen } from "./walk-share-status";

export const dynamic = "force-dynamic";

// Cached per request so generateMetadata and the page body share one lookup.
const getWalkByShareKey = cache((key: string) =>
  prisma.walk.findFirst({
    where: { OR: [{ token: key }, { slug: key }] },
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
      journeyEvents: {
        orderBy: { happenedAt: "asc" },
        select: { id: true, title: true, body: true, happenedAt: true },
      },
    },
  }),
);

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
  const { token } = await params;
  const walk = await getWalkByShareKey(token);
  if (!walk) notFound();

  const [user, theme] = await Promise.all([getOptionalUser(), getSiteTheme()]);
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
  if (token === walk.token && slug !== walk.token) {
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
  const memberNames = attended ? await getWalkMemberNames(walk.id) : [];
  const meeting = meetingPointLabel(walk.location, walk.postcode);
  const walksHref = user?.role === "ADMIN" ? "/admin" : "/walks";
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
        cancelledAt={cancelledAtIso}
        description={walk.description}
        durationMins={walk.durationMins}
        endedAt={endedAtIso}
        icsHref={`/w/${slug}/ics`}
        location={walk.location}
        postcode={walk.postcode}
        signedIn={Boolean(user)}
        startsAt={startsAtIso}
        title={walk.title}
        walkUrl={walkUrl}
      />

      {meeting ? <WalkMapSection location={meeting} walk={walk} /> : null}

      {walk.what3words ? <What3wordsLink address={walk.what3words} /> : null}

      {status === "cancelled" ? null : user ? (
        <WalkLivePanel
          alreadyClockedInAt={myAttendance?.clockedInAt.toISOString() ?? null}
          beforeYouSetOffTips={theme.beforeYouSetOffTips}
          cancelledAt={cancelledAtIso}
          clockedOutAt={myAttendance?.clockedOutAt?.toISOString() ?? null}
          durationMins={walk.durationMins}
          endedAt={endedAtIso}
          memberNames={memberNames}
          startsAt={startsAtIso}
          token={walk.token}
          walksHref={walksHref}
        />
      ) : (
        <WalkShareWhileOpen
          cancelledAt={cancelledAtIso}
          durationMins={walk.durationMins}
          endedAt={endedAtIso}
          startsAt={startsAtIso}
        >
          <BeforeYouSetOff tips={theme.beforeYouSetOffTips} />
          <HowWalksWork steps={theme.howWalksWorkSteps} />
        </WalkShareWhileOpen>
      )}
    </div>
  );
}
