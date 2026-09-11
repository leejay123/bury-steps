"use client";

import { Badge } from "@/components/ui/badge";
import { useWalkClock } from "@/hooks/use-walk-clock";
import {
  effectiveEndsAt,
  formatInProgressCountdown,
  formatStartingSoonCountdown,
  walkStatus,
  type WalkStatus,
} from "@/lib/walk-window";

const LABEL: Record<WalkStatus, string> = {
  cancelled: "Cancelled",
  upcoming: "Upcoming",
  "starting-soon": "Starting soon",
  "in-progress": "In progress",
  completed: "Completed",
};

const VARIANT: Record<WalkStatus, "destructive" | "default" | "secondary" | "outline"> = {
  cancelled: "destructive",
  upcoming: "secondary",
  "starting-soon": "default",
  "in-progress": "default",
  completed: "outline",
};

/**
 * Shared status pill so the walk list, a walk's own page, and member cards
 * always agree. Recomputes when the published start/length (or an early
 * end — see endedAt) says the phase has changed, so a page left open ticks
 * from Starting soon → In progress → Completed on its own. Starting soon
 * shows a live mm:ss countdown to the published start; In progress shows a
 * countdown to when the walk actually finishes.
 */
export function WalkStatusBadge({
  cancelledAt,
  durationMins,
  endedAt = null,
  startsAt,
}: {
  cancelledAt: string | null;
  durationMins: number;
  /** Set once an organiser ends the walk early — see endWalkEarly. */
  endedAt?: string | null;
  startsAt: string;
}) {
  const now = useWalkClock({ cancelledAt, durationMins, endedAt, startsAt });
  const start = new Date(startsAt);
  const walk = {
    cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
    durationMins,
    endedAt: endedAt ? new Date(endedAt) : null,
    startsAt: start,
  };
  const status = walkStatus(walk, now);

  const countdown =
    status === "starting-soon"
      ? formatStartingSoonCountdown(start, now)
      : status === "in-progress"
        ? formatInProgressCountdown(effectiveEndsAt(walk), now)
        : null;
  const label = countdown
    ? `${LABEL[status]} · ${status === "in-progress" ? `${countdown} left` : countdown}`
    : LABEL[status];

  return <Badge variant={VARIANT[status]}>{label}</Badge>;
}
