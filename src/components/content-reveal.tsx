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

function isValueCard(el: HTMLElement): boolean {
  if (el.closest(".t-skel, form")) return false;
  if (el.querySelector("input, textarea, select, form")) return false;
  return el.matches("[data-reveal-card], [data-slot='card'], section.rounded-xl.border");
}

/** The lists, tables and value cards on the page: the shared list
 * (data-reveal-list), a list whose rows are marked data-stagger-item
 * (notices, messages, reports…), real tables, and each content card
 * (a walk card, the October cup, the forecast). Search, tabs and form
 * cards stay still. Outermost only. */
function listParts(page: HTMLElement): HTMLElement[] {
  const found = new Set<HTMLElement>();
  for (const el of page.querySelectorAll<HTMLElement>("[data-reveal-list], table")) found.add(el);
  for (const el of page.querySelectorAll<HTMLElement>("[data-reveal-card], [data-slot='card'], section.rounded-xl.border")) {
    if (isValueCard(el)) found.add(el);
  }
  for (const row of page.querySelectorAll<HTMLElement>("[data-stagger-item]")) {
    const parent = row.parentElement;
    if (!parent) continue;
    const kids = [...parent.children];
    const pure = kids.length > 0 && kids.every((child) => child.hasAttribute("data-stagger-item"));
    if (pure) found.add(parent);
  }
  const shown = [...found].filter((el) => el.getClientRects().length > 0 && !el.closest(".t-skel"));
  return shown.filter((el) => !shown.some((other) => other !== el && other.contains(el)));
}

/** Moves a tree walker past the current element's contents, to whatever
 * comes after it (null at the end). */
function skipContents(walker: TreeWalker): Node | null {
  for (;;) {
    const sibling = walker.nextSibling();
    if (sibling) return sibling;
    if (!walker.parentNode()) return null;
  }
}

/**
 * Grey shapes that copy a part's real layout, like the Members list's
 * hand-made placeholder: one bar per line of text, exactly as long as the
 * words; pictures, avatars, fields and buttons at their own size and
 * roundness. Only these go grey — card edges, borders and row dividers stay
 * on screen. Returns the layer (not yet on the page) and the pieces of
 * content it stands in for.
 *
 * Measures only: nothing is added to the page here, so the browser lays it
 * out once for every part (adding each layer as it was made re-did the
 * whole layout for the next part — a long freeze going Back to a long
 * list). Rows below the fold, and the insides of anything already covered,
 * are skipped whole rather than measured element by element.
 */
function skeletonFor(part: HTMLElement, budget: { left: number }): { layer: HTMLElement; covered: Element[] } | null {
  const box = part.getBoundingClientRect();
  const limit = window.innerHeight * 1.5;
  if (box.height < 4 || box.top > limit) return null;
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
  const walker = document.createTreeWalker(part, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node && budget.left > 0) {
    const el = node as Element;
    const r = el.getBoundingClientRect();
    if (r.top > limit) {
      // Below the fold, and so is everything inside it.
      node = skipContents(walker);
      continue;
    }
    if (r.width < 2 || r.height < 2) {
      node = walker.nextNode();
      continue;
    }
    if (el.matches(MEDIA)) {
      // Same size and roundness as the real thing (avatars stay circles).
      const radius = el.matches("[data-slot='avatar']") ? "9999px" : getComputedStyle(el).borderRadius || "6px";
      shape(r.left, r.top, r.width, r.height, radius === "0px" ? "6px" : radius);
      covered.push(el);
      budget.left--;
      node = skipContents(walker);
      continue;
    }
    const texts = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
    if (!texts.length) {
      node = walker.nextNode();
      continue;
    }
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
    node = skipContents(walker);
  }
  if (!layer.childElementCount) return null;
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
    // Measure every part first, then add all the layers at once.
    const found = parts.flatMap((part) => skeletonFor(part, budget) ?? []);
    const layers = found.map((item) => item.layer);
    document.body.append(...layers);
    const runs: Animation[] = [];
    const total = HOLD_MS + REVEAL_MS;
    const hold = HOLD_MS / total;
    for (const item of found) {
      // The content itself (not the cards and borders around it) is hidden
      // under the grey, then fades in from a soft blur as the grey goes.
      for (const piece of item.covered) {
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
        item.layer.animate(
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
