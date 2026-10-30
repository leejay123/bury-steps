"use client";

import { useEffect, useRef } from "react";

const load = () => import("./letter-field");

/**
 * The homepage hero's moving letters behind a signed-in page's top (the dashboard's
 * page tops, shadcnio.css), spelling the page's name. Finds its page top itself, so
 * every kind of page top can carry it; starts once the browser is idle, and only in
 * the dashboard (signed in, not the homepage or the main-site pages).
 */
export function PageTopField({ word }: { word: string }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    const kind = root.getAttribute("data-page-kind");
    if (root.getAttribute("data-design") !== "shadcnio" || !root.hasAttribute("data-remembered-in")) return;
    if (kind === "home" || kind === "plain") return;
    const host = marker.current?.closest<HTMLElement>("[data-shadcn-top]");
    const text = host?.querySelector<HTMLElement>("[data-page-top-title]")?.parentElement;
    if (!(host && text)) return;
    const letters = word.toUpperCase().replace(/[^A-Z]/g, "") || "BURYSTEPS";
    let gone = false;
    let unmount: (() => void) | undefined;
    const start = () => {
      load()
        .then(({ mountHeroField }) => {
          if (!gone) unmount = mountHeroField(host, text, letters);
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
  }, [word]);
  return <span aria-hidden="true" hidden ref={marker} />;
}
