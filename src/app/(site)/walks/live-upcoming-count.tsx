"use client";

import { useLiveNow } from "@/hooks/use-live-now";
import { windowState } from "@/lib/walk-window";

/**
 * The whole "Upcoming (3)" label, worked out on this device and kept current,
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
  // One piece of text: the tab puts a gap between separate pieces, which
  // turned "Upcoming (", the number and ")" into "Upcoming ( 3 )".
  return <span suppressHydrationWarning>{`Upcoming (${count})`}</span>;
}
