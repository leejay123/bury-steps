"use client";

import { useLiveNow } from "@/hooks/use-live-now";
import { windowState } from "@/lib/walk-window";

/**
 * The number in "Upcoming (3)", worked out on this device and kept current,
 * like the cards below it: a walk drops out of the count when it finishes,
 * even if the page was fetched a few minutes earlier.
 */
export function LiveUpcomingCount({
  walks,
}: {
  walks: { startsAt: string; durationMins: number; endedAt: string | null }[];
}) {
  const now = useLiveNow();
  const count = walks.filter(
    (walk) =>
      windowState(new Date(walk.startsAt), walk.durationMins, now, walk.endedAt ? new Date(walk.endedAt) : null) !==
      "closed",
  ).length;
  return <span suppressHydrationWarning>{count}</span>;
}
