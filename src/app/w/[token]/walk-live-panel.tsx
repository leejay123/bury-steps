"use client";

import Link from "next/link";
import { ClockInForm } from "./clock-in-form";
import { ClockOutButton } from "@/components/clock-out-button";
import { WalkMembers } from "@/components/walk-members";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { formatDateTime } from "@/lib/dates";
import { walkStatus, windowState } from "@/lib/walk-window";
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
          <div className="flex flex-wrap gap-2">
            {completed ? null : <ClockOutButton token={token} />}
            <Button asChild size="sm" variant="outline">
              <Link href={walksHref}>Back to walks</Link>
            </Button>
          </div>
          {completed ? (
            <p className="text-sm text-muted-foreground">
              This walk has finished, and you stayed for the whole thing — there’s nothing left to
              do here.
            </p>
          ) : status === "in-progress" ? (
            <p className="text-sm text-muted-foreground">This walk is in progress.</p>
          ) : null}
        </div>
        <WalkMembers completed={completed} names={memberNames} />
      </div>
    );
  }

  // The "clock-in isn't open yet" notice itself is shown at the top of the
  // page (page.tsx) — this just adds what to do while waiting.
  if (state === "too-early") {
    return <BeforeYouSetOff />;
  }

  // The "this walk has finished, clock-in is closed" notice itself is also
  // shown at the top of the page (page.tsx) — nothing else to add here.
  if (state === "closed") {
    return null;
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
