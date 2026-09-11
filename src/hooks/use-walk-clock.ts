"use client";

import { useEffect, useState } from "react";
import { walkClockDelayMs } from "@/lib/walk-clock-delay";
import { effectiveEndsAt, nextWalkStatusChangeAt, walkStatus } from "@/lib/walk-window";

const ONE_MINUTE_MS = 60_000;

/**
 * A clock that jumps forward at the next walk-status boundary (clock-in
 * opens, start, scheduled end, window closes) so badges and copy update
 * without a refresh. Ticks every second for a live countdown while Starting
 * soon, and again in the final minute In progress (finishing is close
 * enough that seconds matter); the rest of an in-progress walk ticks once a
 * minute instead, since a live countdown running for up to 10 hours has no
 * business waking the tab every second. Cancelled and completed walks do
 * not tick.
 *
 * Far-future waits are chunked — browsers clamp setTimeout above ~24.8
 * days, which would otherwise fire early and leave the badge stuck.
 */
export function useWalkClock(walk: {
  cancelledAt: string | null;
  durationMins: number;
  endedAt?: string | null;
  startsAt: string;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const parsed = {
      cancelledAt: walk.cancelledAt ? new Date(walk.cancelledAt) : null,
      durationMins: walk.durationMins,
      endedAt: walk.endedAt ? new Date(walk.endedAt) : null,
      startsAt: new Date(walk.startsAt),
    };

    let timeoutId: number | undefined;
    let cancelled = false;

    function arm(from: Date) {
      if (cancelled) return;

      function tick() {
        const at = new Date();
        setNow(at);
        arm(at);
      }

      const status = walkStatus(parsed, from);
      if (status === "starting-soon") {
        timeoutId = window.setTimeout(tick, 1000);
        return;
      }
      if (status === "in-progress") {
        const msToEnd = effectiveEndsAt(parsed).getTime() - from.getTime();
        const interval = msToEnd <= ONE_MINUTE_MS ? 1000 : ONE_MINUTE_MS;
        timeoutId = window.setTimeout(tick, Math.max(0, Math.min(interval, msToEnd)));
        return;
      }
      const next = nextWalkStatusChangeAt(parsed, from);
      if (!next) return;
      const delay = walkClockDelayMs(next);
      timeoutId = window.setTimeout(tick, delay);
    }

    arm(new Date());
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [walk.cancelledAt, walk.durationMins, walk.endedAt, walk.startsAt]);

  return now;
}
