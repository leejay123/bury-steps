"use client";

import { useEffect, useState } from "react";

/**
 * A slowly advancing clock for list filters that depend on walkStatus /
 * windowState. Badges already tick via useWalkClock; filters need a shared
 * `now` in their useMemo deps or a Starting-soon walk stays in that filter
 * after it has started.
 */
export function useLiveNow(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
