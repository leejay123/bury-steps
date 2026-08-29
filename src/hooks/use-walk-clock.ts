"use client";

import { useEffect, useState } from "react";
import { walkClockDelayMs } from "@/lib/walk-clock-delay";
import { nextWalkStatusChangeAt } from "@/lib/walk-window";

/**
 * A clock that jumps forward at the next walk-status boundary (clock-in
 * opens, start, scheduled end, window closes) so badges and copy update
 * without a refresh. Cancelled and completed walks do not tick.
 *
 * Far-future waits are chunked — browsers clamp setTimeout above ~24.8
 * days, which would otherwise fire early and leave the badge stuck.
 */
export function useWalkClock(walk: {
  cancelledAt: string | null;
  durationMins: number;
  startsAt: string;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const parsed = {
      cancelledAt: walk.cancelledAt ? new Date(walk.cancelledAt) : null,
      durationMins: walk.durationMins,
      startsAt: new Date(walk.startsAt),
    };

    let timeoutId: number | undefined;
    let cancelled = false;

    function arm(from: Date) {
      if (cancelled) return;
      const next = nextWalkStatusChangeAt(parsed, from);
      if (!next) return;
      const delay = walkClockDelayMs(next);
      timeoutId = window.setTimeout(() => {
        const tick = new Date();
        setNow(tick);
        arm(tick);
      }, delay);
    }

    arm(new Date());
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [walk.cancelledAt, walk.durationMins, walk.startsAt]);

  return now;
}
