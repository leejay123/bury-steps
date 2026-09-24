"use client";

import { formatDate, formatTime } from "@/lib/dates";
import {
  canAddWalkToCalendar,
  walkOpensAt,
  walkStatus,
  windowState,
} from "@/lib/walk-window";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { accountPortalHref } from "@/lib/urls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { WalkFacts } from "@/components/walk-facts";

/**
 * Status-dependent chrome on the public share page: top alerts, title card,
 * and calendar button. Recomputes with useWalkClock so a tab left open
 * through clock-in open / finish does not keep stale copy.
 */
export function WalkShareStatusChrome({
  attended,
  cancelledAt,
  description,
  durationMins,
  endedAt,
  icsHref,
  location,
  postcode,
  signedIn,
  startsAt,
  title,
  walkUrl,
}: {
  attended: boolean;
  cancelledAt: string | null;
  description: string | null;
  durationMins: number;
  endedAt: string | null;
  icsHref: string;
  location: string | null;
  postcode: string | null;
  signedIn: boolean;
  startsAt: string;
  title: string;
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
  const closedNoClockIn = signedIn && !attended && windowStateNow === "closed";
  const opensAt = walkOpensAt(walk.startsAt);
  const showCalendar = canAddWalkToCalendar(walk, now);

  return (
    <>
      {status === "cancelled" ? (
        <Alert variant="destructive">
          <AlertTitle>This walk has been cancelled</AlertTitle>
          <AlertDescription>Check the walks list for the next one.</AlertDescription>
        </Alert>
      ) : completed && !signedIn ? (
        <Alert variant="info">
          <AlertTitle>This walk has finished</AlertTitle>
          <AlertDescription>
            Clock-in is closed. Details and the journey below are still here to look back on.
          </AlertDescription>
        </Alert>
      ) : signedIn && !attended && tooEarly ? (
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
      ) : !signedIn && !completed ? (
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
            <CardTitle className="text-xl">{title}</CardTitle>
            <WalkStatusBadge
              cancelledAt={cancelledAt}
              durationMins={durationMins}
              endedAt={endedAt}
              startsAt={startsAt}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <WalkFacts
            durationMins={durationMins}
            location={location}
            postcode={postcode}
            startsAt={new Date(startsAt)}
          />
          {description ? <p className="text-sm leading-relaxed">{description}</p> : null}
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
