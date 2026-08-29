"use client";

import { Badge } from "@/components/ui/badge";
import { useWalkClock } from "@/hooks/use-walk-clock";
import {
  formatStartingSoonCountdown,
  walkStatus,
  type WalkStatus,
} from "@/lib/walk-window";

const LABEL: Record<WalkStatus, string> = {
  cancelled: "Cancelled",
  upcoming: "Upcoming",
  "starting-soon": "Starting soon",
  "in-progress": "In progress",
  "walk-ended": "Walk ended",
  completed: "Completed",
};

const VARIANT: Record<WalkStatus, "destructive" | "default" | "secondary" | "outline"> = {
  cancelled: "destructive",
  upcoming: "secondary",
  "starting-soon": "default",
  "in-progress": "default",
  "walk-ended": "secondary",
  completed: "outline",
};

/**
 * Shared status pill so the walk list, a walk's own page, and member cards
 * always agree. Recomputes when the published start/length says the phase
 * has changed, so a page left open ticks from Starting soon → In progress
 * → Walk ended → Completed on its own. Starting soon also shows a live
 * mm:ss countdown to the published start.
 */
export function WalkStatusBadge({
  cancelledAt,
  durationMins,
  startsAt,
}: {
  cancelledAt: string | null;
  durationMins: number;
  startsAt: string;
}) {
  const now = useWalkClock({ cancelledAt, durationMins, startsAt });
  const start = new Date(startsAt);
  const status = walkStatus(
    {
      cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
      durationMins,
      startsAt: start,
    },
    now,
  );

  const countdown =
    status === "starting-soon" ? formatStartingSoonCountdown(start, now) : null;
  const label =
    status === "starting-soon" && countdown
      ? `Starting soon · ${countdown}`
      : LABEL[status];

  return <Badge variant={VARIANT[status]}>{label}</Badge>;
}
