"use client";

import Link from "next/link";
import { useContext, useEffect, useRef } from "react";
import { AttendedRuleContext } from "@/components/walk-designer/attended-rule";
import { ClockInDrawer } from "./clock-in-drawer";
import { ClockOutButton } from "@/components/clock-out-button";
import { MyClockInLine } from "@/components/my-clock-in-line";
import { WalkMembers } from "@/components/walk-members";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { useHydrated } from "@/hooks/use-hydrated";
import { useClockedInPreview, useWalkClock } from "@/hooks/use-walk-clock";
import { formatWalkDate } from "@/lib/dates";
import { effectiveEndsAt, formatInProgressCountdown, walkStatus, windowState } from "@/lib/walk-window";
import { Button } from "@/components/ui/button";
import type { WalkMemberName } from "@/lib/walk-members";

export function WalkLivePanel({
  alreadyClockedInAt: realClockedInAt,
  beforeYouSetOffEnabled,
  beforeYouSetOffTips,
  clockedOutAt: realClockedOutAt = null,
  durationMins,
  emergencyContactName = "",
  emergencyContactPhone = "",
  emergencyContactRequired = false,
  endedAt = null,
  memberNames,
  organiserView = false,
  compact = false,
  membersOnly = false,
  statusOnly = false,
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
  /** Organisers and owners see who's on the walk without clocking in. */
  organiserView?: boolean;
  /** Just the button, beside Share or save on a designed page: Clock in while
   * it's open, then Clock out in the same place while on the walk. */
  compact?: boolean;
  /** Just who's on the walk, for a designed page's Attendance tab: the names
   * once this member has clocked in (organisers always), as on this panel. */
  membersOnly?: boolean;
  /** Just this person's own clock-in line (Details card: Your clock-in). */
  statusOnly?: boolean;
  startsAt: string;
  token: string;
  walksHref: string;
}) {
  // The walk page designer can pretend you have (or haven't) clocked in.
  const { alreadyClockedInAt, clockedOutAt } = useClockedInPreview(realClockedInAt, realClockedOutAt, startsAt);
  const start = new Date(startsAt);
  const now = useWalkClock({ cancelledAt: null, durationMins, endedAt, startsAt });
  const attendedRule = useContext(AttendedRuleContext);
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

  if (statusOnly)
    return (
      <MyClockInLine clockedInAt={alreadyClockedInAt} clockedOutAt={clockedOutAt} completed={completed} />
    );

  if (membersOnly) {
    // The design can take the list away once someone clocks out.
    const gone = attendedRule === "on-walk" && Boolean(clockedOutAt);
    return organiserView || (alreadyClockedInAt && !gone) ? (
      <WalkMembers completed={completed} names={memberNames} />
    ) : (
      <p className="text-sm text-muted-foreground">
        {gone
          ? "You clocked out, so the list of who's on the walk is hidden."
          : completed
            ? "Only people who clocked in can see who was on this walk."
            : "Clock in to see who's on the walk."}
      </p>
    );
  }

  if (compact) {
    if (alreadyClockedInAt && !clockedOutAt)
      return completed ? null : <ClockOutButton className="w-full sm:w-auto" token={token} />;
    return state === "open" && !completed ? (
      <ClockInDrawer
        compact
        emergencyContactName={emergencyContactName}
        emergencyContactPhone={emergencyContactPhone}
        emergencyContactRequired={emergencyContactRequired}
        token={token}
      />
    ) : null;
  }

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
  // Organisers and owners: who's on the walk, whether or not they've clocked in.
  const organiserNames = organiserView ? <WalkMembers completed={completed} names={memberNames} /> : null;

  if (state === "too-early") {
    return (
      <>
        {beforeYouSetOffEnabled ? <BeforeYouSetOff tips={beforeYouSetOffTips} /> : null}
        {organiserNames}
      </>
    );
  }

  // The "this walk has finished, clock-in is closed" notice itself is also
  // shown at the top of the page (page.tsx) — nothing else to add here.
  if (state === "closed") {
    return organiserNames;
  }

  // Boxed like the other states of this panel, and kept to a readable width
  // on wide screens instead of running edge to edge.
  return (
    <>
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
        <div>
          <ClockInDrawer
            emergencyContactName={emergencyContactName}
            emergencyContactPhone={emergencyContactPhone}
            emergencyContactRequired={emergencyContactRequired}
            token={token}
          />
        </div>
      </section>
      {organiserNames}
    </>
  );
}
