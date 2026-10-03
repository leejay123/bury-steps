"use client";

import { useLayoutEffect, useRef } from "react";
import { useClientPathname } from "@/components/client-pathname";

/** Same timing as the Members list (spectrumui/skeleton-reveal): a pulse of
 * grey, then a 400ms cross-fade from a 2px blur. */
const HOLD_MS = 320;
const REVEAL_MS = 400;
const BLUR = "blur(2px)";
/** Enough shapes to cover what's on screen; the rest is below the fold. */
const MAX_SHAPES = 140;

const MEDIA = "img, svg, video, canvas, input, textarea, select, button, [data-slot='avatar']";

/** What's under the page's heading: everything after the heading block, at
 * each level up to the page — the heading itself and the header stay still. */
function contentParts(page: HTMLElement): HTMLElement[] {
  const shown = (node: Element) => node.getClientRects().length > 0;
  const heading = ([...page.querySelectorAll("h1")].find(shown) ?? [...page.querySelectorAll("h2")].find(shown))
    ?.parentElement;
  if (!heading || heading === page || !page.contains(heading)) return [];
  const parts: HTMLElement[] = [];
  for (let node: HTMLElement | null = heading; node && node !== page; node = node.parentElement) {
    for (let next = node.nextElementSibling; next; next = next.nextElementSibling) {
      if (next instanceof HTMLElement && shown(next) && getComputedStyle(next).position !== "absolute") parts.push(next);
    }
  }
  return parts;
}

/** Grey shapes drawn over a part, matching its text lines, pictures, fields
 * and buttons — the same look as a hand-made placeholder. */
function skeletonFor(part: HTMLElement, budget: { left: number }): HTMLElement | null {
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
  const picked: Element[] = [];
  for (const el of part.querySelectorAll("*")) {
    if (budget.left <= 0) break;
    if (picked.some((p) => p.contains(el))) continue;
    const isMedia = el.matches(MEDIA);
    const ownText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
    if (!isMedia && !ownText) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.top > window.innerHeight * 1.5) continue;
    picked.push(el);
    budget.left--;
    const shape = document.createElement("div");
    shape.className = "bg-accent animate-pulse " + (el.matches("[data-slot='avatar']") ? "rounded-full" : "rounded-md");
    Object.assign(shape.style, {
      position: "absolute",
      left: `${r.left - box.left}px`,
      top: `${r.top - box.top}px`,
      width: `${r.width}px`,
      height: `${Math.min(r.height, ownText && !isMedia ? Math.max(12, r.height * 0.8) : r.height)}px`,
    });
    layer.append(shape);
  }
  if (!layer.childElementCount) return null;
  document.body.append(layer);
  return layer;
}

/**
 * The Members list's skeleton reveal for everything under each page's
 * heading, on every page change: grey shapes pulse for a moment, then the
 * real content fades in from a soft blur as the grey fades away. Pages that
 * are genuinely still loading show their own placeholders instead (and
 * SkeletonRevealEverywhere reveals them when they arrive).
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

    const parts = contentParts(page).filter((part) => !part.querySelector(".t-skel"));
    const budget = { left: MAX_SHAPES };
    const layers: HTMLElement[] = [];
    const runs: Animation[] = [];
    const total = HOLD_MS + REVEAL_MS;
    const hold = HOLD_MS / total;
    for (const part of parts) {
      const layer = skeletonFor(part, budget);
      if (!layer) continue;
      layers.push(layer);
      runs.push(
        part.animate(
          [
            { opacity: 0, filter: BLUR, offset: 0 },
            { opacity: 0, filter: BLUR, offset: hold },
            { opacity: 1, filter: "blur(0)", offset: 1 },
          ],
          { duration: total, easing: "ease-in-out" },
        ),
        layer.animate(
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
