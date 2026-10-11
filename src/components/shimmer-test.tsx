"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { extractElementInfo } from "@shimmer-from-structure/core";
import { SEARCH_COOKIE } from "@/lib/remembered-nav";
import { readPlaceholderStyle, subscribePlaceholderStyle } from "@/lib/placeholder-style";

type Block = { x: number; y: number; width: number; height: number; radius: string };

const noopSubscribe = () => () => {};

/** Owners only (the header's owner-only search cookie marks them in this browser). */
function readIsOwner(): boolean {
  try {
    return new RegExp(`(?:^|; )${SEARCH_COOKIE}=1(?:;|$)`).test(document.cookie);
  } catch {
    return false;
  }
}

/** Every loading placeholder on the page, outermost only. */
function placeholderRoots(): Element[] {
  return Array.from(document.querySelectorAll("[data-page-loading]")).filter(
    (el) => !el.parentElement?.closest("[data-page-loading]"),
  );
}

/** Measures every placeholder with shimmer-from-structure, in page coordinates. */
function measure(): Block[] {
  const origin = { left: -window.scrollX, top: -window.scrollY } as DOMRect;
  const blocks: Block[] = [];
  for (const root of placeholderRoots()) {
    for (const child of Array.from(root.children)) {
      for (const info of extractElementInfo(child as HTMLElement, origin)) {
        blocks.push({
          x: info.x,
          y: info.y,
          width: info.width,
          height: info.height,
          radius: info.borderRadius === "0px" ? "4px" : info.borderRadius,
        });
      }
    }
  }
  return blocks;
}

/**
 * Temporary owner test: with "Shimmer" picked (placeholder-style.ts), every
 * loading placeholder on the site is drawn the way the shimmer-from-structure
 * library draws one — it measures the placeholder's shapes and lays a
 * shimmering block over each, with the text and our own grey hidden
 * (globals.css, html[data-placeholder-style]). One watcher here instead of
 * editing each placeholder, so switching back to Grey removes it entirely.
 * Before the page's code has loaded (a refresh), the usual grey shows.
 */
export function ShimmerTest() {
  const owner = useSyncExternalStore(noopSubscribe, readIsOwner, () => false);
  const style = useSyncExternalStore(subscribePlaceholderStyle, readPlaceholderStyle, () => "grey" as const);
  const on = owner && style === "shimmer";
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    if (!on) return;
    const html = document.documentElement;
    html.setAttribute("data-placeholder-style", "shimmer");
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = measure();
        // Unchanged → keep the old list, so redrawing doesn't trip the watcher again.
        setBlocks((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
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
      setBlocks([]);
    };
  }, [on]);

  if (!on || blocks.length === 0) return null;
  return createPortal(
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1]" data-shimmer-overlay="">
      {blocks.map((block, index) => (
        <div
          className="absolute overflow-hidden bg-muted"
          key={index}
          style={{
            borderRadius: block.radius,
            height: block.height,
            left: block.x,
            top: block.y,
            width: block.width,
          }}
        >
          <div className="shimmer-test-sweep absolute inset-0" />
        </div>
      ))}
    </div>,
    document.body,
  );
}
