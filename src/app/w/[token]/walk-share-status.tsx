"use client";

import { formatTime, formatWalkDay } from "@/lib/dates";
import {
  canAddWalkToCalendar,
  walkOpensAt,
  walkStatus,
  windowState,
} from "@/lib/walk-window";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WalkDescription } from "@/components/walk-description";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { WalkFacts } from "@/components/walk-facts";

/**
 * Status-dependent chrome on the public share page: top alerts, title card,
 * and calendar button. Recomputes with useWalkClock so a tab left open
 * through clock-in open / finish does not keep stale copy.
 */
export function WalkShareStatusChrome({
  attended,
  part = "all",
  backMarker,
  refreshmentStop,
  cancelledAt,
  cancelledReason = null,
  description,
  distance,
  durationMins,
  endedAt,
  elevationGain,
  essentials,
  grade,
  icsHref,
  location,
  postcode,
  signedIn,
  startsAt,
  title,
  walkLeader,
  withoutSignIn = false,
}: {
  /** Whether this viewer clocked in; unknown on the shared page (see signedIn). */
  attended?: boolean;
  /**
   * The tabbed walk page layouts (walk-tabs-layout.tsx) place the notices
   * and the details separately, and show the title on its own line:
   * "notices" is just the notices; "details" is the card without its title.
   */
  part?: "all" | "notices" | "details" | "sign-in";
  /** Designed pages: leave the sign-in box out of the notices (it's placed
   * on its own, at the top — part "sign-in"). */
  withoutSignIn?: boolean;
  backMarker: string | null;
  refreshmentStop: string | null;
  cancelledAt: string | null;
  /** What the organiser typed when cancelling, if anything. */
  cancelledReason?: string | null;
  description: string | null;
  distance: string | null;
  durationMins: number;
  endedAt: string | null;
  elevationGain: string | null;
  essentials: string[];
  grade: string | null;
  icsHref: string;
  location: string | null;
  postcode: string | null;
  /**
   * Unknown on the shared, ready-made page (the same for everyone): then
   * both the visitor and the member versions of the notices are drawn, and
   * the remembered sign-in hides the wrong one before anything shows
   * ([data-guest-home] / [data-member-home] in globals.css). "Speak to an
   * organiser" after the walk is left to the live part, which knows.
   */
  signedIn?: boolean;
  startsAt: string;
  title: string;
  walkLeader: string | null;
  /** The walk's own address (no longer used here: the sign-in box has no buttons). */
  walkUrl: string;
}) {
  const now = useWalkClock({ cancelledAt, durationMins, endedAt, startsAt });
  const walk = {
    cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
    durationMins,
    endedAt: endedAt ? new Date(endedAt) : null,
    startsAt: new Date(startsAt),
  };
  const status = walkStatus(walk, now);
  const completed = status === "completed";
  const windowStateNow = windowState(walk.startsAt, walk.durationMins, now, walk.endedAt);
  const tooEarly = windowStateNow === "too-early";
  const closedNoClockIn = signedIn === true && !attended && windowStateNow === "closed";
  const opensAt = walkOpensAt(walk.startsAt);
  const showCalendar = canAddWalkToCalendar(walk, now);

  // Notices that depend on who's looking (status === "cancelled" is the same
  // for everyone). Members can't have clocked in before clock-in opens.
  const memberNotice =
    !attended && tooEarly ? (
      <Alert variant="info">
        <AlertDescription>
          Clock-in opens at {formatTime(opensAt)} on {formatWalkDay(opensAt)}, an hour before the start.
        </AlertDescription>
      </Alert>
    ) : null;
  const closedNotice = <WalkClosedNoClockInNotice />;
  // No buttons of its own: Sign in and Join are in the site header.
  const signInPrompt = completed ? null : (
    <div className="space-y-1 rounded-lg border bg-muted/40 p-5">
      <p className="font-medium">You need to sign in to join this walk</p>
      <p className="text-sm text-muted-foreground">
        Clock-in is only for signed-in members. If you do not have an account yet, use Join the group at the
        top of the page; if you already have one, use Sign in.
      </p>
    </div>
  );
  const guestNotice = completed ? (
    <Alert variant="info">
      <AlertDescription>This walk has finished. The details are kept here to look back on.</AlertDescription>
    </Alert>
  ) : withoutSignIn ? null : (
    signInPrompt
  );
  // Just the sign-in box, for a designed page's top (visitors only).
  if (part === "sign-in")
    return status === "cancelled" || !signInPrompt || signedIn ? null : signedIn === undefined ? (
      <div className="contents" data-guest-home="">
        {signInPrompt}
      </div>
    ) : (
      signInPrompt
    );

  const notices =
    status === "cancelled" ? (
      <Alert variant="destructive">
        <AlertTitle>This walk has been cancelled</AlertTitle>
        <AlertDescription>
          {cancelledReason?.trim() ? `${cancelledReason.trim().replace(/[.!]?$/, ".")} ` : ""}
          Check the walks list for the next one.
        </AlertDescription>
      </Alert>
    ) : signedIn === undefined ? (
      <>
        {guestNotice ? (
          <div className="contents" data-guest-home="">
            {guestNotice}
          </div>
        ) : null}
        {memberNotice ? (
          <div className="contents" data-member-home="">
            {memberNotice}
          </div>
        ) : null}
      </>
    ) : signedIn ? (
      (memberNotice ?? (closedNoClockIn ? closedNotice : null))
    ) : (
      guestNotice
    );
  if (part === "notices") return notices;

  return (
    <>
      {part === "all" ? notices : null}

      <Card className="gap-4">
        {part === "details" ? null : (
          <CardHeader>
            {/* Label beside the title from sm up; full width under it on phones. */}
            <div className="flex w-full min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {/* The page's one <h1> (CardTitle is a div): screen readers and
                  search engines take the walk's name from it. */}
              <h1 className="min-w-0 text-xl leading-none font-semibold" data-slot="card-title">
                {title}
              </h1>
              <WalkStatusBadge
                cancelledAt={cancelledAt}
                className="max-sm:w-full max-sm:justify-center max-sm:py-1"
                durationMins={durationMins}
                endedAt={endedAt}
                startsAt={startsAt}
              />
            </div>
          </CardHeader>
        )}
        <CardContent className="flex flex-col gap-4">
          <WalkFacts
            backMarker={backMarker}
            refreshmentStop={refreshmentStop}
            distance={distance}
            durationMins={durationMins}
            elevationGain={elevationGain}
            essentials={essentials}
            grade={grade}
            location={location}
            postcode={postcode}
            startsAt={new Date(startsAt)}
            walkLeader={walkLeader}
          />
          {description ? <WalkDescription description={description} /> : null}
          {showCalendar ? (
            <div>
              <Button asChild size="sm" variant="outline">
                <a download href={icsHref}>
                  Add to calendar
                </a>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

/** Renders children only while the walk is not yet completed (live). */
export function WalkShareWhileOpen({
  cancelledAt,
  durationMins,
  endedAt,
  startsAt,
  children,
}: {
  cancelledAt: string | null;
  durationMins: number;
  endedAt: string | null;
  startsAt: string;
  children: React.ReactNode;
}) {
  const now = useWalkClock({ cancelledAt, durationMins, endedAt, startsAt });
  const completed =
    walkStatus(
      {
        cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
        durationMins,
        endedAt: endedAt ? new Date(endedAt) : null,
        startsAt: new Date(startsAt),
      },
      now,
    ) === "completed";
  if (completed) return null;
  return <>{children}</>;
}

/** Shows its children only until clock-in opens (the live panel's "too-early"
 * state) — where a signed-in member's Before you set off used to sit. */
export function WalkShareBeforeClockIn({
  durationMins,
  endedAt,
  startsAt,
  children,
}: {
  durationMins: number;
  endedAt: string | null;
  startsAt: string;
  children: React.ReactNode;
}) {
  const now = useWalkClock({ cancelledAt: null, durationMins, endedAt, startsAt });
  const state = windowState(new Date(startsAt), durationMins, now, endedAt ? new Date(endedAt) : null);
  if (state !== "too-early") return null;
  return <>{children}</>;
}

/**
 * After a walk, for a member who didn't clock in: who to speak to. Shown by
 * the live part of the walk page, which knows whether they clocked in.
 */
export function WalkClosedNoClockInNotice() {
  return (
    <Alert variant="info">
      <AlertDescription>This walk has finished. Were you there? Ask an organiser to add you.</AlertDescription>
    </Alert>
  );
}
