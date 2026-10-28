"use client";

import { useEffect, useLayoutEffect } from "react";

const WORD = "BURYSTEPS";
const load = () => import("./letter-field");

/**
 * Starts shadcn.io's moving letter field behind the hero, as they do: once the
 * browser is idle, around the block holding `heading`, inside the closest
 * `[data-slot="hero"]` box. Renders nothing itself; the field adds its canvas.
 */
export function HeroField({ heading }: { heading: string }) {
  useLayoutEffect(() => {
    const title = document.getElementById(heading);
    const host = title?.closest<HTMLElement>('[data-slot="hero"]');
    const text = title?.parentElement;
    if (!(host && text)) return;
    let gone = false;
    let unmount: (() => void) | undefined;
    const start = () => {
      load()
        .then(({ mountHeroField }) => {
          if (!gone) unmount = mountHeroField(host, text, WORD);
        })
        .catch(() => undefined);
    };
    let cancel: () => void;
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(start, { timeout: 1500 });
      cancel = () => cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(start, 200);
      cancel = () => clearTimeout(id);
    }
    return () => {
      gone = true;
      cancel();
      unmount?.();
    };
  }, [heading]);
  return null;
}

/** The same field behind the closing call to action, started as it nears the screen. */
export function BandField({ heading }: { heading: string }) {
  useEffect(() => {
    const title = document.getElementById(heading);
    const host = title?.closest<HTMLElement>("section");
    const text = title?.parentElement;
    if (!(host && text)) return;
    let gone = false;
    let unmount: (() => void) | undefined;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        near.disconnect();
        load()
          .then(({ mountBandField }) => {
            if (!gone) unmount = mountBandField(host, text, WORD);
          })
          .catch(() => undefined);
      },
      { rootMargin: "600px 0px" },
    );
    near.observe(host);
    return () => {
      gone = true;
      near.disconnect();
      unmount?.();
    };
  }, [heading]);
  return null;
}
