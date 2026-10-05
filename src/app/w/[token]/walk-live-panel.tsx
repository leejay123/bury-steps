"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ClockInForm } from "./clock-in-form";
import { ClockOutButton } from "@/components/clock-out-button";
import { WalkMembers } from "@/components/walk-members";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { useHydrated } from "@/hooks/use-hydrated";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { formatWalkDate } from "@/lib/dates";
import { effectiveEndsAt, formatInProgressCountdown, walkStatus, windowState } from "@/lib/walk-window";
import { Button } from "@/components/ui/button";
import type { WalkMemberName } from "@/lib/walk-members";

export function WalkLivePanel({
  alreadyClockedInAt,
  beforeYouSetOffEnabled,
  beforeYouSetOffTips,
  clockedOutAt = null,
  durationMins,
  emergencyContactName = "",
  emergencyContactPhone = "",
  emergencyContactRequired = false,
  endedAt = null,
  memberNames,
  startsAt,
  token,
  walksHref,
}: {
  alreadyClockedInAt: string | null;
  /** Settings → Site wording → Walk page cards. Off hides the card. */
  beforeYouSetOffEnabled: boolean;
  /** Editable in Settings → Site wording → Walk page cards — see @/lib/homepage-copy. */
  beforeYouSetOffTips: readonly string[];
  /** Set when the member left early — see clockOut. */
  clockedOutAt?: string | null;
  durationMins: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRequired?: boolean;
  /** Set once an organiser ends the walk early — see endWalkEarly. */
  endedAt?: string | null;
  memberNames: WalkMemberName[];
  startsAt: string;
  token: string;
  walksHref: string;
}) {
  const start = new Date(startsAt);
  const now = useWalkClock({ cancelledAt: null, durationMins, endedAt, startsAt });
  const walk = { cancelledAt: null, durationMins, endedAt: endedAt ? new Date(endedAt) : null, startsAt: start };
  const status = walkStatus(walk, now);
  const state = windowState(start, durationMins, now, walk.endedAt);
  const completed = status === "completed";
  // Time-free until hydrated, so the server's HTML matches (see useHydrated).
  const hydrated = useHydrated();
  const countdown =
    hydrated && status === "in-progress" ? formatInProgressCountdown(effectiveEndsAt(walk), now) : null;
  const leftEarly = Boolean(alreadyClockedInAt && clockedOutAt);

  // After clocking in or out the panel swaps to the new status. Move focus
  // there (and bring it into view) so keyboard and screen-reader users hear
  // what happened instead of being dropped back at the top of the page.
  const statusRef = useRef<HTMLParagraphElement>(null);
  const onWalk = Boolean(alreadyClockedInAt && !clockedOutAt);
  const previousOnWalk = useRef(onWalk);
  useEffect(() => {
    if (previousOnWalk.current === onWalk) return;
    previousOnWalk.current = onWalk;
    const status = statusRef.current;
    if (!status) return;
    status.focus({ preventScroll: true });
    status.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [onWalk]);

  // Still on the walk (never clocked out).
  if (alreadyClockedInAt && !clockedOutAt) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-5">
          <div className="flex flex-col gap-1">
            <p className="font-medium outline-none" ref={statusRef} tabIndex={-1}>
              {completed ? "You attended this walk" : "You are clocked in"}
            </p>
            <p className="text-sm tabular-nums text-muted-foreground">
              Recorded at {formatWalkDate(alreadyClockedInAt)}
            </p>
          </div>
          {completed ? (
            <p className="text-sm text-muted-foreground">
              This walk has finished, and you stayed for the whole thing — there’s nothing left to
              do here.
            </p>
          ) : status === "in-progress" ? (
            <p className="text-sm tabular-nums text-muted-foreground">
              This walk is in progress{countdown ? ` · finishes in ${countdown}` : ""}.
            </p>
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

  // Left early — once the walk is over, show that as attendance, not the
  // "you weren't there" closed notice. While the window is still open they
  // can clock back in below.
  if (leftEarly && (completed || state === "closed")) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-5">
          <div className="flex flex-col gap-1">
            <p className="font-medium">You attended this walk</p>
            <p className="text-sm tabular-nums text-muted-foreground">
              Clocked in at {formatWalkDate(alreadyClockedInAt!)} · left at{" "}
              {formatWalkDate(clockedOutAt!)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            You left before the walk finished. There&rsquo;s nothing left to do here.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={walksHref}>Back to walks</Link>
            </Button>
          </div>
        </div>
        <WalkMembers completed names={memberNames} />
      </div>
    );
  }

  // The "clock-in isn't open yet" notice itself is shown at the top of the
  // page (page.tsx) — this just adds what to do while waiting.
  if (state === "too-early") {
    return beforeYouSetOffEnabled ? <BeforeYouSetOff tips={beforeYouSetOffTips} /> : null;
  }

  // The "this walk has finished, clock-in is closed" notice itself is also
  // shown at the top of the page (page.tsx) — nothing else to add here.
  if (state === "closed") {
    return null;
  }

  // Boxed like the other states of this panel, and kept to a readable width
  // on wide screens instead of running edge to edge.
  return (
    <section
      aria-labelledby={`clock-in-heading-${token}`}
      className="flex flex-col gap-4 rounded-lg border p-5 sm:p-6"
      id="clock-in"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold" id={`clock-in-heading-${token}`}>
          Clock in
        </h2>
        {leftEarly ? (
          <p className="text-sm text-muted-foreground outline-none" ref={statusRef} tabIndex={-1}>
            You left early. Clock in again if you&rsquo;ve come back to the walk.
          </p>
        ) : status === "in-progress" ? (
          <p className="text-sm tabular-nums text-muted-foreground">
            This walk is in progress{countdown ? ` · finishes in ${countdown}` : ""}.
          </p>
        ) : null}
      </div>
      <div className="max-w-2xl">
        <ClockInForm
          emergencyContactName={emergencyContactName}
          emergencyContactPhone={emergencyContactPhone}
          emergencyContactRequired={emergencyContactRequired}
          token={token}
        />
      </div>
    </section>
  );
}
