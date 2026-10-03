"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** How often an open page asks whether anything has changed. */
const CHECK_EVERY_MS = 30_000;

/**
 * Keeps open pages up to date without anyone reloading. Every 30 seconds
 * while the tab is showing (and straight away when you come back to it),
 * it asks whether anything on the site has been saved since it last looked
 * (/api/site-version). If so, router.refresh() fetches this page again and
 * swaps the new content in place — no placeholder, scroll position and
 * anything typed are kept — and forgets every other page it remembered, so
 * the next page opened is fresh too.
 */
export function LiveUpdates() {
  const router = useRouter();
  const seen = useRef<string | null>(null);

  useEffect(() => {
    let checking = false;
    const check = async () => {
      if (checking || document.visibilityState !== "visible") return;
      checking = true;
      try {
        const response = await fetch("/api/site-version", { cache: "no-store" });
        if (!response.ok) return;
        const { v } = (await response.json()) as { v: string };
        if (seen.current !== null && v !== seen.current) router.refresh();
        seen.current = v;
      } catch {
        // Offline for a moment: try again next time.
      } finally {
        checking = false;
      }
    };
    void check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    const onReturn = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [router]);

  return null;
}
