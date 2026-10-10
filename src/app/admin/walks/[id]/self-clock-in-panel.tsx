"use client";

import { ClockInForm } from "@/app/w/[token]/clock-in-form";
import { ClockOutButton } from "@/components/clock-out-button";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { formatDateTime, formatTime, formatWalkDay } from "@/lib/dates";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { walkOpensAt, walkStatus, windowState } from "@/lib/walk-window";

/**
 * The same clock-in a member gets, on the organiser walk page. Owners and
 * organisers use the pre-walk check and are recorded on the attendance list.
 */
export function SelfClockInPanel({
  alreadyClockedInAt,
  clockedOutAt = null,
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
        <AlertTitle>Clock-in is not open yet</AlertTitle>
        <AlertDescription>
          It opens an hour before the walk starts, at {formatTime(opensAt)} on {formatWalkDay(opensAt)}.
          You’ll use the same pre-walk check as members.
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
      <ClockInForm
        emergencyContactName={emergencyContactName}
        emergencyContactPhone={emergencyContactPhone}
        emergencyContactRequired={emergencyContactRequired}
        token={token}
      />
    </div>
  );
}
