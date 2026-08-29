"use client";

import Link from "next/link";
import { ClockInForm } from "./clock-in-form";
import { ClockOutButton } from "@/components/clock-out-button";
import { WalkMembers } from "@/components/walk-members";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { formatDate, formatDateTime, formatTime } from "@/lib/dates";
import { walkOpensAt, walkStatus, windowState } from "@/lib/walk-window";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function WalkLivePanel({
  alreadyClockedInAt,
  durationMins,
  memberNames,
  startsAt,
  token,
  walksHref,
}: {
  alreadyClockedInAt: string | null;
  durationMins: number;
  memberNames: string[];
  startsAt: string;
  token: string;
  walksHref: string;
}) {
  const start = new Date(startsAt);
  const now = useWalkClock({ cancelledAt: null, durationMins, startsAt });
  const status = walkStatus({ cancelledAt: null, durationMins, startsAt: start }, now);
  const state = windowState(start, durationMins, now);
  const opensAt = walkOpensAt(start);
  const completed = status === "completed";

  if (alreadyClockedInAt) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-5">
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              {completed ? "You attended this walk" : "You are clocked in"}
            </p>
            <p className="text-sm tabular-nums text-muted-foreground">
              Recorded at {formatDateTime(new Date(alreadyClockedInAt))}
            </p>
          </div>
          {completed ? (
            <p className="text-sm text-muted-foreground">
              This walk has finished, and you stayed for the whole thing — there’s nothing left to
              do here.
            </p>
          ) : status === "in-progress" ? (
            <p className="text-sm text-muted-foreground">This walk is in progress.</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {completed ? null : <ClockOutButton token={token} />}
            <Button asChild size="sm" variant="outline">
              <Link href={walksHref}>Back to walks</Link>
            </Button>
          </div>
        </div>
        <WalkMembers completed={completed} names={memberNames} />
      </div>
    );
  }

  if (state === "too-early") {
    return (
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
    );
  }

  if (state === "closed") {
    return (
      <Alert>
        <AlertTitle>This walk has finished</AlertTitle>
        <AlertDescription>
          Clock-in is closed. If you were there, speak to an organiser — they can add you to the
          list.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {status === "in-progress" ? (
        <p className="text-sm text-muted-foreground">This walk is in progress.</p>
      ) : null}
      <ClockInForm token={token} />
    </div>
  );
}
