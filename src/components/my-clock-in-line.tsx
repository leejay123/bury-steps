"use client";

import { formatTime, formatWalkDate } from "@/lib/dates";

/**
 * One line about this person's own clock-in, for a designed page's Details
 * card ("Your clock-in" inside the title box) and the organisers' own panel:
 * nothing until they clock in. The same for members, organisers and owners
 * (agreed wording, Nov 2026):
 *
 * - on the walk:            You are clocked in – Recorded at 09:20, Sun 8 Nov
 * - clocked out, still open: You clocked out. Clock in again if you've come back.
 * - finished, stayed:        You attended this walk – recorded 09:20 to 14:15 – start to finish
 * - finished, left early:    You attended this walk – recorded 09:20 to 11:05 – left early
 */
export function MyClockInLine({
  clockedInAt,
  clockedOutAt,
  completed,
  endsAt,
}: {
  clockedInAt: string | null;
  clockedOutAt: string | null;
  completed: boolean;
  /** When the walk ends (or ended): the end of "recorded … to …" for someone who stayed. */
  endsAt: Date;
}) {
  if (!clockedInAt) return null;
  if (completed) {
    const left = clockedOutAt ? new Date(clockedOutAt) : null;
    return (
      <p className="text-sm tabular-nums">
        <span className="font-medium">You attended this walk</span>
        <span className="text-muted-foreground">
          <span data-dot=""> – </span>
          recorded {formatTime(new Date(clockedInAt))} to {formatTime(left ?? endsAt)} –{" "}
          {left ? "left early" : "start to finish"}
        </span>
      </p>
    );
  }
  if (clockedOutAt)
    return (
      <p className="text-sm">
        <span className="font-medium">You clocked out.</span>{" "}
        <span className="text-muted-foreground">Clock in again if you&rsquo;ve come back.</span>
      </p>
    );
  return (
    <p className="text-sm tabular-nums">
      <span className="font-medium">You are clocked in</span>
      <span className="text-muted-foreground">
        <span data-dot=""> – </span>
        Recorded at {formatWalkDate(clockedInAt)}
      </span>
    </p>
  );
}
