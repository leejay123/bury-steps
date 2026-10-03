"use client";

import { useLayoutEffect, useRef } from "react";
import { useClientPathname } from "@/components/client-pathname";

/** Same timing as the Members list (spectrumui/skeleton-reveal): a pulse of
 * grey, then a 400ms cross-fade from a 2px blur. */
const HOLD_MS = 320;
const REVEAL_MS = 400;
const BLUR = "blur(2px)";
/** Enough shapes to cover what's on screen; the rest is below the fold. */
const MAX_SHAPES = 220;

const MEDIA = "img, svg, video, canvas, input, textarea, select, button, [data-slot='avatar']";

/** The lists and tables on the page: the shared list (data-reveal-list),
 * any list whose rows are marked data-stagger-item (walks, notices,
 * messages, reports…), and real tables. Outermost only. */
function listParts(page: HTMLElement): HTMLElement[] {
  const found = new Set<HTMLElement>();
  for (const el of page.querySelectorAll<HTMLElement>("[data-reveal-list], table")) found.add(el);
  for (const row of page.querySelectorAll<HTMLElement>("[data-stagger-item]")) {
    if (row.parentElement) found.add(row.parentElement);
  }
  const shown = [...found].filter((el) => el.getClientRects().length > 0 && !el.closest(".t-skel"));
  return shown.filter((el) => !shown.some((other) => other !== el && other.contains(el)));
}

/**
 * Grey shapes that copy a part's real layout, like the Members list's
 * hand-made placeholder: one bar per line of text, exactly as long as the
 * words; pictures, avatars, fields and buttons at their own size and
 * roundness. Only these go grey — card edges, borders and row dividers stay
 * on screen. Returns the layer and the pieces of content it stands in for.
 */
function skeletonFor(part: HTMLElement, budget: { left: number }): { layer: HTMLElement; covered: Element[] } | null {
  const box = part.getBoundingClientRect();
  if (box.height < 4 || box.top > window.innerHeight * 1.5) return null;
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, {
    position: "absolute",
    left: `${box.left + window.scrollX}px`,
    top: `${box.top + window.scrollY}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    pointerEvents: "none",
    zIndex: "40",
  });
  const shape = (left: number, top: number, width: number, height: number, radius: string) => {
    const el = document.createElement("div");
    el.className = "bg-accent animate-pulse";
    Object.assign(el.style, {
      position: "absolute",
      left: `${left - box.left}px`,
      top: `${top - box.top}px`,
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: radius,
    });
    layer.append(el);
  };
  const covered: Element[] = [];
  const range = document.createRange();
  for (const el of part.querySelectorAll("*")) {
    if (budget.left <= 0) break;
    if (covered.some((c) => c.contains(el))) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.top > window.innerHeight * 1.5) continue;
    if (el.matches(MEDIA)) {
      // Same size and roundness as the real thing (avatars stay circles).
      const radius = el.matches("[data-slot='avatar']") ? "9999px" : getComputedStyle(el).borderRadius || "6px";
      shape(r.left, r.top, r.width, r.height, radius === "0px" ? "6px" : radius);
      covered.push(el);
      budget.left--;
      continue;
    }
    const texts = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
    if (!texts.length) continue;
    // One bar per line, as long as the words on that line.
    for (const text of texts) {
      range.selectNodeContents(text);
      for (const line of range.getClientRects()) {
        if (line.width < 2 || budget.left <= 0) continue;
        shape(line.left, line.top + line.height * 0.18, line.width, Math.max(8, line.height * 0.64), "4px");
        budget.left--;
      }
    }
    covered.push(el);
  }
  if (!layer.childElementCount) return null;
  document.body.append(layer);
  return { layer, covered };
}

/**
 * The Members list's skeleton reveal for every list and table, on every
 * page change: grey shapes copying each row's layout pulse for a moment,
 * then the real rows fade in from a soft blur as the grey fades away.
 * Headings, search boxes, filters and buttons outside the list stay still. Pages that
 * are genuinely still loading show their own placeholders instead (and
 * SkeletonHoldScript reveals them when they arrive).
 *
 * Not on the homepage (which should simply be there), not on the very first
 * load (the page is already on screen by then — greying it would flicker),
 * not where a list has its own reveal (Members), and not for people who
 * prefer reduced motion. Browser animations only, so nothing is left behind.
 */
export function ContentReveal() {
  const pathname = useClientPathname();
  const previous = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (pathname === null) return;
    const from = previous.current;
    previous.current = pathname;
    if (from === null || from === pathname || pathname === "/") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const page = document.querySelector<HTMLElement>("main > div");
    if (!page) return;
    // Still loading: its own placeholders are showing already.
    if ([...page.querySelectorAll('[data-slot="skeleton"]')].some((n) => n.getClientRects().length)) return;

    const parts = listParts(page);
    const budget = { left: MAX_SHAPES };
    const layers: HTMLElement[] = [];
    const runs: Animation[] = [];
    const total = HOLD_MS + REVEAL_MS;
    const hold = HOLD_MS / total;
    for (const part of parts) {
      const found = skeletonFor(part, budget);
      if (!found) continue;
      layers.push(found.layer);
      // The content itself (not the cards and borders around it) is hidden
      // under the grey, then fades in from a soft blur as the grey goes.
      for (const piece of found.covered) {
        runs.push(
          piece.animate(
            [
              { opacity: 0, filter: BLUR, offset: 0 },
              { opacity: 0, filter: BLUR, offset: hold },
              { opacity: 1, filter: "blur(0)", offset: 1 },
            ],
            { duration: total, easing: "ease-in-out" },
          ),
        );
      }
      runs.push(
        found.layer.animate(
          [
            { opacity: 1, filter: "blur(0)", offset: 0 },
            { opacity: 1, filter: "blur(0)", offset: hold },
            { opacity: 0, filter: BLUR, offset: 1 },
          ],
          { duration: total, easing: "ease-in-out", fill: "forwards" },
        ),
      );
    }
    const done = window.setTimeout(() => layers.forEach((layer) => layer.remove()), total + 50);
    return () => {
      window.clearTimeout(done);
      runs.forEach((run) => run.cancel());
      layers.forEach((layer) => layer.remove());
    };
  }, [pathname]);

  return null;
}
