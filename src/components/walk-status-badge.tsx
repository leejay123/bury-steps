"use client";

import { Badge } from "@/components/ui/badge";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { walkStatus, type WalkStatus } from "@/lib/walk-window";

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
 * → Walk ended → Completed on its own.
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
  const status = walkStatus(
    {
      cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
      durationMins,
      startsAt: new Date(startsAt),
    },
    now,
  );

  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
