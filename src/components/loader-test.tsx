"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SEARCH_COOKIE } from "@/lib/remembered-nav";
import { readPlaceholderStyle, subscribePlaceholderStyle } from "@/lib/placeholder-style";

const noopSubscribe = () => () => {};

/** Owners only (the header's owner-only search cookie marks them in this browser). */
function readIsOwner(): boolean {
  try {
    return new RegExp(`(?:^|; )${SEARCH_COOKIE}=1(?:;|$)`).test(document.cookie);
  } catch {
    return false;
  }
}

/**
 * Temporary owner test: with "Loader" picked (placeholder-style.ts), a
 * loading page shows the logo and a spinner instead of its grey shapes
 * (globals.css, html[data-placeholder-style="loader"]). The shapes stay,
 * hidden, so the page doesn't jump when it arrives.
 */
export function LoaderTest() {
  const owner = useSyncExternalStore(noopSubscribe, readIsOwner, () => false);
  const style = useSyncExternalStore(subscribePlaceholderStyle, readPlaceholderStyle, () => "grey" as const);
  const on = owner && style === "loader";

  useEffect(() => {
    if (!on) return;
    const html = document.documentElement;
    html.setAttribute("data-placeholder-style", "loader");
    return () => {
      if (html.getAttribute("data-placeholder-style") === "loader") html.removeAttribute("data-placeholder-style");
    };
  }, [on]);

  return null;
}
