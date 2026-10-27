"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { InfinityLoop } from "@/components/ui/infinity-loop";

const OUTERMOST = "[data-page-loading]:not([data-page-loading] [data-page-loading])";

function sameList(a: Element[], b: Element[]) {
  return a.length === b.length && a.every((el, i) => el === b[i]);
}

/**
 * The loading screen's spinner (loading-ui's Infinity loader): put in the
 * middle of every page's loading placeholder while it's on screen. The
 * placeholder itself is blanked out by globals.css, keeping its space.
 */
export function PageLoader() {
  const [targets, setTargets] = useState<Element[]>([]);

  useEffect(() => {
    let frame = 0;
    const find = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = Array.from(document.querySelectorAll(OUTERMOST));
        setTargets((current) => (sameList(current, next) ? current : next));
      });
    };
    const mutations = new MutationObserver(find);
    mutations.observe(document.body, { attributeFilter: ["data-page-loading"], childList: true, subtree: true });
    find();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
    };
  }, []);

  return targets.map((target, index) =>
    createPortal(
      <div
        aria-hidden
        className="pointer-events-none absolute top-[min(50%,35vh)] left-1/2 -translate-x-1/2 -translate-y-1/2 text-foreground"
        data-page-loader=""
      >
        <InfinityLoop className="size-20" />
      </div>,
      target,
      String(index),
    ),
  );
}
