"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";
import { canFetchAhead } from "@/components/site-nav-items";

/**
 * A link on a list of many (the Settings table, a walk or member list) that
 * fetches its page only once someone shows they're about to open it —
 * pointer over it, a finger down on it, or keyboard focus — instead of
 * every row fetching as soon as it's on screen. Each fetch costs server
 * time on the free plan, so fetching twenty rows to open one is waste.
 * The Next.js guide's "hover-triggered prefetch" (node_modules/next/dist/
 * docs/01-app/02-guides/prefetching.md). `full`: also fetch the page's
 * address-specific data (a walk's or member's own page), the per-link
 * prefetch={true}; only for pages converted to fetch ahead.
 */
export function IntentLink({
  full = false,
  onPointerEnter,
  onTouchStart,
  onFocus,
  ...props
}: Omit<ComponentProps<typeof Link>, "prefetch"> & { full?: boolean }) {
  const [wanted, setWanted] = useState(false);
  // Not a sign-in-only page for a visitor (canFetchAhead).
  const want = () => {
    if (canFetchAhead(typeof props.href === "string" ? props.href : (props.href.pathname ?? ""))) setWanted(true);
  };
  return (
    <Link
      {...props}
      onFocus={(event) => {
        want();
        onFocus?.(event);
      }}
      onPointerEnter={(event) => {
        want();
        onPointerEnter?.(event);
      }}
      onTouchStart={(event) => {
        want();
        onTouchStart?.(event);
      }}
      prefetch={wanted ? (full ? true : null) : false}
    />
  );
}
