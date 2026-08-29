import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getOptionalUser, requireUser } from "@/lib/auth";
import { formatWalkDate, formatDateTime, formatDate, formatTime } from "@/lib/dates";
import { windowState, OPENS_BEFORE_MS } from "@/lib/walk-window";
import { accountPortalHref, appUrl } from "@/lib/urls";
import { meetingPointLabel } from "@/lib/geocode";
import { ensureWalkPoint } from "@/lib/walk-coordinates";
import { ClockInForm } from "./clock-in-form";
import { ClockOutButton } from "@/components/clock-out-button";
import { WalkMembers } from "@/components/walk-members";
import { WalkFacts } from "@/components/walk-facts";
import { WalkMap } from "@/components/walk-map";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { HowWalksWork } from "@/components/how-walks-work";
import { getWalkMemberNames } from "@/lib/walk-members";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// Cached per request so generateMetadata and the page body share one lookup.
const getWalkByToken = cache((token: string) =>
  prisma.walk.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      title: true,
      description: true,
      location: true,
      postcode: true,
      latitude: true,
      longitude: true,
      startsAt: true,
      durationMins: true,
      cancelledAt: true,
    },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const walk = await getWalkByToken(token);
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
    // Unguessable, one-off share links — not meant to show up in search.
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
  const walkUrl = `${appUrl()}/w/${token}`;

  const [walk, user] = await Promise.all([getWalkByToken(token), getOptionalUser()]);

  if (!walk) notFound();

  const alreadyIn = user
    ? await prisma.attendance.findFirst({
        where: { walkId: walk.id, userId: user.id, clockedOutAt: null },
        select: { clockedInAt: true },
      })
    : null;

  const memberNames = alreadyIn ? await getWalkMemberNames(walk.id) : [];
  const meeting = meetingPointLabel(walk.location, walk.postcode);
  const mapPoint = meeting ? await ensureWalkPoint(walk) : null;

  const state = windowState(walk.startsAt, walk.durationMins);
  const walksHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";
  const opensAt = new Date(walk.startsAt.getTime() - OPENS_BEFORE_MS);

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
            {walk.cancelledAt && <Badge variant="destructive">Cancelled</Badge>}
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

      {meeting ? <WalkMap location={meeting} point={mapPoint} /> : null}

      {walk.cancelledAt ? null : !user ? (
        <>
          <BeforeYouSetOff />
          <HowWalksWork />
        </>
      ) : alreadyIn ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-5">
            <div className="flex flex-col gap-1">
              <p className="font-medium">
                {state === "closed" ? "You attended this walk" : "You are clocked in"}
              </p>
              <p className="text-sm tabular-nums text-muted-foreground">
                Recorded at {formatDateTime(alreadyIn.clockedInAt)}
              </p>
            </div>
            {state === "closed" ? (
              // Clocking out is for leaving early (or right at the end) —
              // once the walk itself has finished, staying clocked in the
              // whole time just means you did the full walk. Nothing left
              // to do, so no Clock out button here.
              <p className="text-sm text-muted-foreground">
                This walk has finished, and you stayed for the whole thing — there’s nothing left
                to do here.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {state === "closed" ? null : <ClockOutButton token={walk.token} />}
              <Button asChild size="sm" variant="outline">
                <Link href={walksHref}>Back to walks</Link>
              </Button>
            </div>
          </div>
          <WalkMembers completed={state === "closed"} names={memberNames} />
        </div>
      ) : state === "too-early" ? (
        <div className="flex flex-col gap-4">
          <Alert>
            <AlertTitle>Clock-in is not open yet</AlertTitle>
            <AlertDescription>
              It opens an hour before the walk starts, at {formatTime(opensAt)} on{" "}
              {formatDate(opensAt)}. Come back on the day and this page will be ready.
            </AlertDescription>
          </Alert>
          <BeforeYouSetOff />
          <Button asChild className="self-start" size="sm" variant="outline">
            <Link href={walksHref}>Back to walks</Link>
          </Button>
        </div>
      ) : state === "closed" ? (
        <Alert>
          <AlertTitle>Clock-in has closed</AlertTitle>
          <AlertDescription>
            If you were there, speak to an organiser and they can sort it out.
          </AlertDescription>
        </Alert>
      ) : (
        <SignedInClockIn token={walk.token} />
      )}
    </div>
  );
}

async function SignedInClockIn({ token }: { token: string }) {
  await requireUser();
  return <ClockInForm token={token} />;
}
