"use client";

import { Badge } from "@/components/ui/badge";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { formatWalkDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
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

type WalkStatusInput = {
  cancelledAt: string | null;
  durationMins: number;
  /** Set once an organiser ends the walk early — see endWalkEarly. */
  endedAt?: string | null;
  startsAt: string;
};

/**
 * The walk's live status and its label. Recomputes when the published
 * start/length (or an early end — see endedAt) says the phase has changed,
 * so a page left open ticks from Starting soon → In progress → Completed on
 * its own. Starting soon shows a live mm:ss countdown to the published
 * start; In progress shows a countdown to when the walk actually finishes.
 */
function useWalkStatusLabel({ cancelledAt, durationMins, endedAt = null, startsAt }: WalkStatusInput) {
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
  return { status, label };
}

/**
 * Shared status pill so the walk list, a walk's own page, and member cards
 * always agree.
 */
export function WalkStatusBadge({ className, ...walk }: WalkStatusInput & { className?: string }) {
  const { status, label } = useWalkStatusLabel(walk);
  return (
    <Badge className={className} variant={VARIANT[status]}>
      {label}
    </Badge>
  );
}

/**
 * The status as a walk card's header strip: status on the left, the day on
 * the right. Plain grey for every status — the same as the Members list's
 * group headings; the words say what's happening (no coloured strips).
 * Sits edge to edge across the top of the card.
 */
export function WalkStatusHeader({ className, ...walk }: WalkStatusInput & { className?: string }) {
  const { label } = useWalkStatusLabel(walk);
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b bg-muted/50 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      <span>{label}</span>
      <span className="shrink-0">{formatWalkDay(walk.startsAt)}</span>
    </div>
  );
}
