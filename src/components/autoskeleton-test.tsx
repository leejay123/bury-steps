"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { SEARCH_COOKIE } from "@/lib/remembered-nav";
import { readPlaceholderStyle, subscribePlaceholderStyle } from "@/lib/placeholder-style";
import type { AutoSkeletonBox as Box } from "./autoskeleton-overlay";

// The library (and its stylesheet) loads only once an owner picks it.
const AutoSkeletonOverlay = dynamic(() => import("./autoskeleton-overlay").then((mod) => mod.AutoSkeletonOverlay), {
  ssr: false,
});

const noopSubscribe = () => () => {};

/** Owners only (the header's owner-only search cookie marks them in this browser). */
function readIsOwner(): boolean {
  try {
    return new RegExp(`(?:^|; )${SEARCH_COOKIE}=1(?:;|$)`).test(document.cookie);
  } catch {
    return false;
  }
}

/** Where a placeholder sits on the page; a display: contents box has no size of its own, so its children's. */
function pageBox(el: Element): Box | null {
  const rects =
    window.getComputedStyle(el).display === "contents"
      ? Array.from(el.children).map((child) => child.getBoundingClientRect())
      : [el.getBoundingClientRect()];
  const shown = rects.filter((rect) => rect.width > 0 && rect.height > 0);
  if (shown.length === 0) return null;
  const left = Math.min(...shown.map((rect) => rect.left));
  const top = Math.min(...shown.map((rect) => rect.top));
  const right = Math.max(...shown.map((rect) => rect.right));
  const bottom = Math.max(...shown.map((rect) => rect.bottom));
  return {
    x: left + window.scrollX,
    y: top + window.scrollY,
    width: right - left,
    height: bottom - top,
    home: Boolean(el.closest("[data-member-home]")) && window.location.pathname === "/",
  };
}

function measure(): Box[] {
  return Array.from(document.querySelectorAll("[data-page-loading]"))
    .filter((el) => !el.parentElement?.closest("[data-page-loading]"))
    .map(pageBox)
    .filter((box): box is Box => box !== null);
}

/**
 * Temporary owner test: with "AutoSkeleton" picked (placeholder-style.ts),
 * every loading placeholder on the site is covered by one of the
 * AutoSkeleton library's ready-made shapes, in the same spot and size, with
 * ours hidden underneath (globals.css, html[data-placeholder-style]). One
 * watcher here instead of editing each placeholder, so switching back
 * removes it entirely. Before the page's code has loaded (a refresh), the
 * usual grey shows.
 */
export function AutoSkeletonTest() {
  const owner = useSyncExternalStore(noopSubscribe, readIsOwner, () => false);
  const style = useSyncExternalStore(subscribePlaceholderStyle, readPlaceholderStyle, () => "grey" as const);
  const on = owner && style === "autoskeleton";
  // Read in the browser (not usePathname), so the shared page shell stays made ahead.
  const [path, setPath] = useState("");
  const [boxes, setBoxes] = useState<Box[]>([]);

  useEffect(() => {
    if (!on) return;
    const html = document.documentElement;
    html.setAttribute("data-placeholder-style", "autoskeleton");
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = measure();
        setPath(window.location.pathname);
        // Unchanged → keep the old list, so redrawing doesn't trip the watcher again.
        setBoxes((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      });
    };
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { attributeFilter: ["data-page-loading"], childList: true, subtree: true });
    const sizes = new ResizeObserver(schedule);
    sizes.observe(document.body);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      sizes.disconnect();
      html.removeAttribute("data-placeholder-style");
      setBoxes([]);
    };
  }, [on]);

  if (!on || boxes.length === 0) return null;
  return createPortal(<AutoSkeletonOverlay boxes={boxes} path={path} />, document.body);
}
