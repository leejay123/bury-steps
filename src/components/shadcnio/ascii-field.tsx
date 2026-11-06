"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

const WORD = "BURYSTEPS";
const load = () => import("./letter-field");

/**
 * Starts shadcn.io's moving letter field behind the hero, as they do: once the
 * browser is idle, around the block holding `heading`, inside the closest
 * `[data-slot="hero"]` box, spelling `word` (as their Privacy page spells
 * PRIVACY). Renders nothing itself; the field adds its canvas.
 */
export function HeroField({ heading, word = WORD }: { heading: string; word?: string }) {
  const probe = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const doc = probe.current?.ownerDocument ?? document;
    const title = doc.getElementById(heading);
    const host = title?.closest<HTMLElement>('[data-slot="hero"]');
    const text = title?.parentElement;
    if (!(host && text)) return;
    let gone = false;
    let unmount: (() => void) | undefined;
    const start = () => {
      load()
        .then(({ mountHeroField }) => {
          if (!gone) unmount = mountHeroField(host, text, word);
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
  }, [heading, word]);
  return <span aria-hidden="true" hidden ref={probe} />;
}

/** The same field behind the closing call to action, started as it nears the screen. */
export function BandField({ heading }: { heading: string }) {
  const probe = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const doc = probe.current?.ownerDocument ?? document;
    const title = doc.getElementById(heading);
    const host = title?.closest<HTMLElement>('[data-slot="hero"]');
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
  return <span aria-hidden="true" hidden ref={probe} />;
}
