"use client";

import { useEffect, useState } from "react";

/**
 * iOS Safari keeps `position: fixed` elements pinned to the layout
 * viewport, not the visual one. When the keyboard opens and the page
 * scrolls to bring a focused input into view (needed so the input isn't
 * hidden behind the keyboard), a dialog centered with `top: 50%` keeps
 * computing that 50% against the full layout height — which now includes
 * space the keyboard covers — so it visibly drifts toward the top instead
 * of staying centered in the area actually visible above the keyboard.
 *
 * Returns the vertical midpoint (in px, relative to the layout viewport)
 * of whatever's actually visible right now, or `null` before the first
 * measurement (server render / very first paint) — callers should fall
 * back to plain CSS centering until a number is available.
 */
export function useVisualViewportCenterY(): number | null {
  const [centerY, setCenterY] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => setCenterY(vv.offsetTop + vv.height / 2);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return centerY;
}
