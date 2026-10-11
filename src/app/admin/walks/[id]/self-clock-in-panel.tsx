"use client";

import { ClockInDrawer } from "@/app/w/[token]/clock-in-drawer";
import { ClockOutButton } from "@/components/clock-out-button";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { formatDateTime, formatTime, formatWalkDay } from "@/lib/dates";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { walkOpensAt, walkStatus, windowState } from "@/lib/walk-window";

/**
 * The same clock-in a member gets, on the organiser walk page. Owners and
 * organisers use the pre-walk check and are recorded on the attendance list.
 */
export function SelfClockInPanel({
  alreadyClockedInAt,
  clockedOutAt = null,
  compact = false,
  durationMins,
  emergencyContactName = "",
  emergencyContactPhone = "",
  emergencyContactRequired = false,
  endedAt = null,
  startsAt,
  token,
}: {
  alreadyClockedInAt: string | null;
  clockedOutAt?: string | null;
  /** Only the Clock in button, and only while it can be used. */
  compact?: boolean;
  durationMins: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRequired?: boolean;
  endedAt?: string | null;
  startsAt: string;
  token: string;
}) {
  const start = new Date(startsAt);
  const now = useWalkClock({ cancelledAt: null, durationMins, endedAt, startsAt });
  const walk = { cancelledAt: null, durationMins, endedAt: endedAt ? new Date(endedAt) : null, startsAt: start };
  const status = walkStatus(walk, now);
  const state = windowState(start, durationMins, now, walk.endedAt);
  const completed = status === "completed";
  const leftEarly = Boolean(alreadyClockedInAt && clockedOutAt);

  // Just the button, for a bar or banner (walk-tabs-layout.tsx): only while
  // this organiser can clock in; the full panel elsewhere says the rest.
  if (compact) {
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
            Recorded at {formatDateTime(new Date(alreadyClockedInAt))}
          </p>
        </div>
        {completed ? (
          <p className="text-sm text-muted-foreground">
            This walk has finished, and you stayed for the whole thing.
          </p>
        ) : (
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
          Clocked in at {formatDateTime(new Date(alreadyClockedInAt!))} · left at{" "}
          {formatDateTime(new Date(clockedOutAt!))}
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
          Clock-in opens at {formatTime(opensAt)} on {formatWalkDay(opensAt)}, an hour before the start.
        </AlertDescription>
      </Alert>
    );
  }

  if (state === "closed") return null;

  return (
    <div className="flex flex-col gap-4">
      {leftEarly ? (
        <p className="text-sm text-muted-foreground">
          You left early. Clock in again if you’ve come back to the walk.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Clock in now, the same way a member does.</p>
      )}
      <ClockInDrawer
        emergencyContactName={emergencyContactName}
        emergencyContactPhone={emergencyContactPhone}
        emergencyContactRequired={emergencyContactRequired}
        token={token}
      />
    </div>
  );
}
