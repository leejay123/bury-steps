import { cache } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getOptionalUser } from "@/lib/auth";
import { formatWalkDate } from "@/lib/dates";
import { accountPortalHref, appUrl } from "@/lib/urls";
import { meetingPointLabel } from "@/lib/geocode";
import { ensureWalkSlug, walkShareUrl } from "@/lib/walk-slug";
import { WalkFacts } from "@/components/walk-facts";
import { WalkMapSection } from "@/components/walk-map-section";
import { WalkJourneyTimeline } from "@/components/walk-journey-timeline";
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
      startsAt: true,
      durationMins: true,
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
  if (!walk) return { title: "Walk not found — Bury Steps Walking Group" };

  const when = formatWalkDate(walk.startsAt);
  const meeting = meetingPointLabel(walk.location, walk.postcode);
  const title = `${walk.title} — Bury Steps Walking Group`;
  const description = walk.cancelledAt
    ? `Cancelled. Was ${when}${meeting ? ` at ${meeting}` : ""}.`
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

  const slug = await ensureWalkSlug(walk);
  if (token === walk.token && slug !== walk.token) {
    redirect(`/w/${slug}`);
  }

  const walkUrl = walkShareUrl(appUrl(), { token: walk.token, slug });
  const user = await getOptionalUser();

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
  const meeting = meetingPointLabel(walk.location, walk.postcode);
  const walksHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <div className="flex flex-col gap-6">
      <Link
        className="text-sm text-muted-foreground hover:text-foreground"
        href={user ? walksHref : "/"}
      >
        ← {user ? "Walks" : "Home"}
      </Link>

      {walk.cancelledAt ? (
        <Alert variant="destructive">
          <AlertTitle>This walk has been cancelled</AlertTitle>
          <AlertDescription>Check the walks list for the next one.</AlertDescription>
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
        </CardContent>
      </Card>

      {meeting ? <WalkMapSection location={meeting} walk={walk} /> : null}

      {walk.journeyEvents.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium">Journey</h2>
          <p className="text-sm text-muted-foreground">What happened on this walk.</p>
          <WalkJourneyTimeline
            events={walk.journeyEvents.map((event) => ({
              id: event.id,
              title: event.title,
              body: event.body,
              happenedAt: event.happenedAt.toISOString(),
            }))}
          />
        </section>
      ) : null}

      {walk.cancelledAt ? null : !user ? (
        <>
          <BeforeYouSetOff />
          <HowWalksWork />
        </>
      ) : (
        <WalkLivePanel
          alreadyClockedInAt={alreadyIn?.clockedInAt.toISOString() ?? null}
          durationMins={walk.durationMins}
          memberNames={memberNames}
          startsAt={walk.startsAt.toISOString()}
          token={walk.token}
          walksHref={walksHref}
        />
      )}
    </div>
  );
}
