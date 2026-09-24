"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const MIN_INTERVAL_MS = 15_000;

/**
 * Soft-refresh the current RSC payload when the tab becomes visible again
 * (or the window regains focus). Used on walk share + Upcoming so a cancel
 * or End walk done elsewhere is picked up without a full navigation —
 * badges and clock-in otherwise keep showing the SSR cancelledAt/endedAt
 * until the next natural status tick.
 *
 * Throttled so rapid focus flips do not spam refresh.
 */
export function useRouterRefreshOnVisible() {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    function maybeRefresh() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      const now = Date.now();
      if (now - lastRefreshAt.current < MIN_INTERVAL_MS) return;
      lastRefreshAt.current = now;
      router.refresh();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") maybeRefresh();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", maybeRefresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", maybeRefresh);
    };
  }, [router]);
}
