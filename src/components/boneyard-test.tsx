"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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

type Drawn = { x: number; y: number; width: number; height: number; html: string };

/**
 * Temporary owner test: with "Boneyard" picked (placeholder-style.ts), each
 * loading placeholder is photographed by boneyard-js (snapshotBones reads
 * the size and spot of every visible shape in it) and Boneyard's own bones
 * are drawn over it, in the same place. Unlike AutoSkeleton's ready-made
 * shapes, these follow our placeholders exactly. The library loads only
 * once an owner picks it.
 */
export function BoneyardTest() {
  const owner = useSyncExternalStore(noopSubscribe, readIsOwner, () => false);
  const style = useSyncExternalStore(subscribePlaceholderStyle, readPlaceholderStyle, () => "grey" as const);
  const on = owner && style === "boneyard";
  const [drawn, setDrawn] = useState<Drawn[]>([]);

  useEffect(() => {
    if (!on) return;
    let cancelled = false;
    let frame = 0;
    let lib: typeof import("boneyard-js") | null = null;
    const draw = () => {
      if (!lib) return;
      const next: Drawn[] = [];
      for (const el of Array.from(document.querySelectorAll("[data-page-loading]"))) {
        if (el.parentElement?.closest("[data-page-loading]")) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const bones = lib.snapshotBones(el, "placeholder");
        next.push({
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
          html: lib.renderBones(bones, "var(--accent)", true),
        });
      }
      setDrawn((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    void import("boneyard-js").then((mod) => {
      if (cancelled) return;
      lib = mod;
      schedule();
    });
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { attributeFilter: ["data-page-loading"], childList: true, subtree: true });
    const sizes = new ResizeObserver(schedule);
    sizes.observe(document.body);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      mutations.disconnect();
      sizes.disconnect();
      setDrawn([]);
    };
  }, [on]);

  if (!on || drawn.length === 0) return null;
  return createPortal(
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1]" data-boneyard-overlay="">
      {drawn.map((item, index) => (
        <div
          className="absolute overflow-hidden bg-background"
          // Boneyard's own drawing of our placeholder's shapes (made from
          // their positions on this page, no outside content).
          dangerouslySetInnerHTML={{ __html: item.html }}
          key={index}
          style={{ height: item.height, left: item.x, top: item.y, width: item.width }}
        />
      ))}
    </div>,
    document.body,
  );
}
