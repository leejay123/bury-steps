"use client";

import { useEffect, useState } from "react";
import { SERVER_CLOCK_EVENT, serverNow } from "@/lib/server-clock";

/**
 * A slowly advancing clock (the site's time, see server-clock.ts) for list filters that depend on walkStatus /
 * windowState. Badges already tick via useWalkClock; filters need a shared
 * `now` in their useMemo deps or a Starting-soon walk stays in that filter
 * after it has started.
 */
export function useLiveNow(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => serverNow());

  useEffect(() => {
    const update = () => setNow(serverNow());
    const id = window.setInterval(update, intervalMs);
    // When the site's clock turns out to differ from this device's, catch up.
    window.addEventListener(SERVER_CLOCK_EVENT, update);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(SERVER_CLOCK_EVENT, update);
    };
  }, [intervalMs]);

  return now;
}
