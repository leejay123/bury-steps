import { cache } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getOptionalUser } from "@/lib/auth";
import { formatDate, formatTime, formatWalkDate } from "@/lib/dates";
import { accountPortalHref, appUrl } from "@/lib/urls";
import { meetingPointLabel } from "@/lib/geocode";
import { What3wordsLink } from "@/components/what3words-link";
import { ensureWalkSlug, walkShareUrl } from "@/lib/walk-slug";
import { canAddWalkToCalendar, walkOpensAt, walkStatus, windowState } from "@/lib/walk-window";
import { WalkFacts } from "@/components/walk-facts";
import { WalkMapSection } from "@/components/walk-map-section";
import { WalkJourneyDrawer } from "@/components/walk-journey-drawer";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { HowWalksWork } from "@/components/how-walks-work";
import { getWalkMemberNames } from "@/lib/walk-members";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { WalkLivePanel } from "./walk-live-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const user = await getOptionalUser();
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
  const completed = status === "completed";

  const alreadyIn = user
    ? await prisma.attendance.findFirst({
        where: { walkId: walk.id, userId: user.id, clockedOutAt: null },
        select: { clockedInAt: true },
      })
    : null;

  // Names only once this member has clocked in — privacy for guests and
  // people who have not joined yet. WalkMembers paginates at 20, so a
  // thousand names on one walk stay usable.
  const memberNames = alreadyIn ? await getWalkMemberNames(walk.id) : [];
  const windowStateNow = windowState(walk.startsAt, walk.durationMins, new Date(), walk.endedAt);
  const tooEarly = windowStateNow === "too-early";
  // A signed-in member who never clocked in and the window has now closed —
  // this used to only show at the very bottom of the page (inside
  // WalkLivePanel), easy to miss under the walk details and map above it.
  const closedNoClockIn = Boolean(user) && !alreadyIn && windowStateNow === "closed";
  const opensAt = walkOpensAt(walk.startsAt);
  const meeting = meetingPointLabel(walk.location, walk.postcode);
  const walksHref = user?.role === "ADMIN" ? "/admin" : "/walks";
  const journeyEvents = walk.journeyEvents.map((event) => ({
    id: event.id,
    title: event.title,
    body: event.body,
    happenedAt: event.happenedAt.toISOString(),
  }));

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

      {status === "cancelled" ? (
        <Alert variant="destructive">
          <AlertTitle>This walk has been cancelled</AlertTitle>
          <AlertDescription>Check the walks list for the next one.</AlertDescription>
        </Alert>
      ) : completed && !user ? (
        <Alert variant="info">
          <AlertTitle>This walk has finished</AlertTitle>
          <AlertDescription>
            Clock-in is closed. Details and the journey below are still here to look back on.
          </AlertDescription>
        </Alert>
      ) : user && !alreadyIn && tooEarly ? (
        <Alert variant="info">
          <AlertTitle>Clock-in is not open yet</AlertTitle>
          <AlertDescription>
            It opens an hour before the walk starts, at {formatTime(opensAt)} on{" "}
            {formatDate(opensAt)}. Come back on the day and this page will be ready.
          </AlertDescription>
        </Alert>
      ) : closedNoClockIn ? (
        <Alert variant="info">
          <AlertTitle>This walk has finished</AlertTitle>
          <AlertDescription>
            Clock-in is closed. If you were there, speak to an organiser — they can add you to the
            list.
          </AlertDescription>
        </Alert>
      ) : !user ? (
        <div className="space-y-4 rounded-lg border bg-muted/40 p-5">
          <div className="space-y-1">
            <p className="font-medium">You need to sign in to join this walk</p>
            <p className="text-sm text-muted-foreground">
              Clock-in is only for signed-in members. If you do not have an account yet, create one
              first. If you already have an account, sign in. You will come back to this walk
              afterwards.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={accountPortalHref("sign-up", walkUrl)}>Create an account</a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={accountPortalHref("sign-in", walkUrl)}>Sign in</a>
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="gap-4">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl">{walk.title}</CardTitle>
            <WalkStatusBadge
              cancelledAt={walk.cancelledAt?.toISOString() ?? null}
              durationMins={walk.durationMins}
              endedAt={walk.endedAt?.toISOString() ?? null}
              startsAt={walk.startsAt.toISOString()}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <WalkFacts
            durationMins={walk.durationMins}
            location={walk.location}
            postcode={walk.postcode}
            startsAt={walk.startsAt}
          />
          {walk.description ? (
            <p className="text-sm leading-relaxed">{walk.description}</p>
          ) : null}
          {canAddWalkToCalendar(walk) ? (
            <div>
              <Button asChild size="sm" variant="outline">
                <a download href={`/w/${slug}/ics`}>
                  Add to calendar
                </a>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {meeting ? <WalkMapSection location={meeting} walk={walk} /> : null}

      {walk.what3words ? <What3wordsLink address={walk.what3words} /> : null}

      {status === "cancelled" ? null : user ? (
        <WalkLivePanel
          alreadyClockedInAt={alreadyIn?.clockedInAt.toISOString() ?? null}
          durationMins={walk.durationMins}
          endedAt={walk.endedAt?.toISOString() ?? null}
          memberNames={memberNames}
          startsAt={walk.startsAt.toISOString()}
          token={walk.token}
          walksHref={walksHref}
        />
      ) : completed ? null : (
        <>
          <BeforeYouSetOff />
          <HowWalksWork />
        </>
      )}
    </div>
  );
}
