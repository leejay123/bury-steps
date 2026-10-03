"use client";

import { useEffect } from "react";

/** Same feel as the Members list's SkeletonReveal (spectrumui/skeleton-reveal). */
const REVEAL_MS = 400;
const REVEAL_BLUR = "2px";

/**
 * The Members list's skeleton reveal, everywhere: whenever grey placeholders
 * on a page are replaced by the real content, that content fades in from a
 * soft blur in the same spot instead of snapping in. It watches the page
 * rather than each page opting in, so every list, card and loading screen
 * behaves the same.
 *
 * Only when a placeholder was actually showing — a page that comes straight
 * from memory just appears. Nothing moves (the page slide is PageFade's),
 * and it uses the browser's own animations, which leave nothing behind.
 */
export function SkeletonRevealEverywhere() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const hadSkeleton = (node: Node) =>
      node instanceof Element && (node.matches('[data-slot="skeleton"]') || !!node.querySelector('[data-slot="skeleton"]'));

    const observer = new MutationObserver((records) => {
      // Did placeholders leave in this batch of changes?
      if (!records.some((record) => [...record.removedNodes].some(hadSkeleton))) return;
      const added = new Set<HTMLElement>();
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement) || node.matches("script, style, template")) continue;
          // The new content, not more placeholders.
          if (hadSkeleton(node)) continue;
          added.add(node);
        }
      }
      // Only the outermost new parts; what's inside fades with them.
      for (const node of added) {
        if ([...added].some((other) => other !== node && other.contains(node))) continue;
        node.animate(
          [
            { opacity: 0, filter: `blur(${REVEAL_BLUR})` },
            { opacity: 1, filter: "blur(0)" },
          ],
          { duration: REVEAL_MS, easing: "ease-in-out" },
        );
      }
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
