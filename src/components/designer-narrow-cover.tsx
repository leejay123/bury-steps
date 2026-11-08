"use client";

import { useSyncExternalStore } from "react";
import { Monitor } from "lucide-react";

/** The designers are for computers: this wide (1024px) or wider. */
const WIDE = "(min-width: 1024px)";

function subscribeWide(change: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
const isWide = () => window.matchMedia(WIDE).matches;

/**
 * Over a designer (walk page or site page) when its window is made narrower
 * than a computer screen, so it never shows squashed. Nothing is closed or
 * lost: the designer stays open underneath, exactly as it was, and comes back
 * as soon as the window is wide enough again. (The Design buttons already
 * only show at this width, so phones and tablets never open one.)
 */
export function DesignerNarrowCover() {
  const wide = useSyncExternalStore(subscribeWide, isWide, () => true);
  if (wide) return null;
  return (
    <div
      aria-live="polite"
      className="absolute inset-0 z-[150] flex items-center justify-center bg-background px-6 text-center"
      data-designer-narrow=""
      role="status"
    >
      <div className="flex max-w-sm flex-col items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Monitor aria-hidden className="size-5 text-muted-foreground" />
        </span>
        <p className="font-semibold text-lg">Make this window wider to keep designing</p>
        <p className="text-muted-foreground text-sm">
          The designer needs a computer-sized window (1024px or wider). Nothing has been lost: your work is
          still here and comes back as soon as the window is wide enough.
        </p>
      </div>
    </div>
  );
}
