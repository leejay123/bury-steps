"use client";

import { ClockInDrawer } from "@/app/(site)/w/[token]/clock-in-drawer";
import { ClockOutButton } from "@/components/clock-out-button";
import { MyClockInLine } from "@/components/my-clock-in-line";
import { useClockedInPreview, useWalkClock } from "@/hooks/use-walk-clock";
import { formatDateTime, formatTime, formatWalkDay } from "@/lib/dates";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { walkOpensAt, walkStatus, windowState, effectiveEndsAt } from "@/lib/walk-window";

/**
 * The same clock-in a member gets, on the organiser walk page. Owners and
 * organisers use the pre-walk check and are recorded on the attendance list.
 */
export function SelfClockInPanel({
  alreadyClockedInAt: realClockedInAt,
  buttonElsewhere = false,
  clockedOutAt: realClockedOutAt = null,
  compact = false,
  statusOnly = false,
  durationMins,
  emergencyContactName = "",
  emergencyContactPhone = "",
  emergencyContactRequired = false,
  endedAt = null,
  startsAt,
  token,
}: {
  alreadyClockedInAt: string | null;
  /** The Clock in button is shown elsewhere (a header style), so not here too. */
  buttonElsewhere?: boolean;
  clockedOutAt?: string | null;
  /** Only the Clock in button, and only while it can be used. */
  compact?: boolean;
  /** Just this organiser's own clock-in line (Details card: Your clock-in). */
  statusOnly?: boolean;
  durationMins: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRequired?: boolean;
  endedAt?: string | null;
  startsAt: string;
  token: string;
}) {
  // The walk page designer can pretend you have (or haven't) clocked in.
  const { alreadyClockedInAt, clockedOutAt } = useClockedInPreview(realClockedInAt, realClockedOutAt, startsAt);
  const start = new Date(startsAt);
  const now = useWalkClock({ cancelledAt: null, durationMins, endedAt, startsAt });
  const walk = { cancelledAt: null, durationMins, endedAt: endedAt ? new Date(endedAt) : null, startsAt: start };
  const status = walkStatus(walk, now);
  const state = windowState(start, durationMins, now, walk.endedAt);
  const completed = status === "completed";
  const leftEarly = Boolean(alreadyClockedInAt && clockedOutAt);

  // Just the button, for a bar or banner (walk-tabs-layout.tsx): Clock in
  // while this organiser can, then Clock out in the same place while they're
  // on the walk; the full panel elsewhere says the rest.
  if (statusOnly)
    return (
      <MyClockInLine
        clockedInAt={alreadyClockedInAt}
        clockedOutAt={clockedOutAt}
        completed={completed}
        endsAt={effectiveEndsAt(walk)}
      />
    );

  if (compact) {
    if (alreadyClockedInAt && !clockedOutAt && !completed)
      return <ClockOutButton className="w-full sm:w-auto" token={token} />;
    const canClockIn = state === "open" && !completed && !(alreadyClockedInAt && !clockedOutAt);
    return canClockIn ? (
      <ClockInDrawer
        compact
        emergencyContactName={emergencyContactName}
        emergencyContactPhone={emergencyContactPhone}
        emergencyContactRequired={emergencyContactRequired}
        token={token}
      />
    ) : null;
  }

  if (alreadyClockedInAt && !clockedOutAt) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-5">
        <div className="flex flex-col gap-1">
          <p className="font-medium">{completed ? "You attended this walk" : "You are clocked in"}</p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {completed
              ? `Recorded ${formatTime(new Date(alreadyClockedInAt))} to ${formatTime(effectiveEndsAt(walk))} – start to finish`
              : `Recorded at ${formatDateTime(new Date(alreadyClockedInAt))}`}
          </p>
        </div>
        {completed ? null : (
          <div className="flex flex-wrap gap-2">
            <ClockOutButton token={token} />
          </div>
        )}
      </div>
    );
  }

  if (leftEarly && (completed || state === "closed")) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-5">
        <p className="font-medium">You attended this walk</p>
        <p className="text-sm tabular-nums text-muted-foreground">
          Recorded {formatTime(new Date(alreadyClockedInAt!))} to {formatTime(new Date(clockedOutAt!))} – left early
        </p>
      </div>
    );
  }

  if (state === "too-early") {
    // Same info box members get on the walk's page (walk-share-status.tsx).
    const opensAt = walkOpensAt(new Date(startsAt));
    return (
      <Alert variant="info">
        <AlertDescription>
          Clock-in opens at {formatTime(opensAt)} on {formatWalkDay(opensAt)}.
        </AlertDescription>
      </Alert>
    );
  }

  if (state === "closed" || buttonElsewhere) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* The same as members see: just the button (and a line if they clocked out). */}
      {leftEarly ? (
        <p className="text-sm text-muted-foreground">You clocked out. Clock in again if you&rsquo;ve come back.</p>
      ) : null}
      <ClockInDrawer
        emergencyContactName={emergencyContactName}
        emergencyContactPhone={emergencyContactPhone}
        emergencyContactRequired={emergencyContactRequired}
        token={token}
      />
    </div>
  );
}
