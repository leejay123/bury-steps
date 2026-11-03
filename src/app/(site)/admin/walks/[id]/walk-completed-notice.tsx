"use client";

import { useWalkClock } from "@/hooks/use-walk-clock";
import { walkStatus } from "@/lib/walk-window";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWalkWording } from "@/components/walk-wording-context";

/** Info banner once the walk has finished — ticks live so a page left open
 * through the scheduled end does not keep offering Cancel/Edit advice that
 * no longer applies (the action toolbar updates separately). */
export function WalkCompletedNotice({
  cancelledAt,
  durationMins,
  endedAt,
  show,
  startsAt,
}: {
  cancelledAt: string | null;
  durationMins: number;
  endedAt: string | null;
  show: boolean;
  startsAt: string;
}) {
  const now = useWalkClock({ cancelledAt, durationMins, endedAt, startsAt });
  const words = useWalkWording();
  if (!show) return null;

  const status = walkStatus(
    {
      cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
      durationMins,
      endedAt: endedAt ? new Date(endedAt) : null,
      startsAt: new Date(startsAt),
    },
    now,
  );
  if (status !== "completed") return null;

  return (
    <Alert variant="info">
      <AlertDescription>
        {/* Kept to one line on a computer, so the box stays small. */}
        {words.organiserFinished}
      </AlertDescription>
    </Alert>
  );
}
