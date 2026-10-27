"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { InfinityLoop } from "@/components/ui/infinity-loop";
import { readPlaceholderPreview } from "@/lib/placeholder-preview-cookie";
import { applyLoadingStyle, readLoadingStyle, subscribeLoadingStyle } from "@/lib/loading-style";

// If a page never arrives (a lost connection, an error), the cover steps
// aside after this long instead of hiding the page for ever — except while
// an owner is previewing the loading screen (Placeholders: Always).
const GIVE_UP_MS = 20_000;

// Every page's loading placeholder (loading.tsx and the loading fallbacks).
const PLACEHOLDER = "[data-page-loading]";

/**
 * The loading screen: while any part of the page is still loading (a
 * placeholder marked data-page-loading is on screen), the page's own area
 * is blank with loading-ui's Infinity loader in the middle, until the page
 * has arrived. The header, footer and phone bar stay on show around it.
 */
export function PageLoader() {
  const [loading, setLoading] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  // An owner trying the grey skeletons instead (lib/loading-style.ts).
  const style = useSyncExternalStore(subscribeLoadingStyle, readLoadingStyle, () => "loader" as const);

  useEffect(() => {
    applyLoadingStyle(style);
  }, [style]);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const now = Boolean(document.querySelector(PLACEHOLDER));
        setLoading(now);
        if (!now) setGaveUp(false);
      });
    };
    const mutations = new MutationObserver(check);
    mutations.observe(document.body, { attributeFilter: ["data-page-loading"], childList: true, subtree: true });
    check();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!loading || readPlaceholderPreview() === "always") return;
    const timer = window.setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const showing = loading && !gaveUp && style !== "skeletons";

  // While it shows, the page's area holds nothing else (globals.css), so the
  // loading screen is the same size every time: one screen, the footer at
  // the bottom, and the loader in the middle of the space between.
  useEffect(() => {
    const html = document.documentElement;
    if (showing) html.setAttribute("data-page-loader-on", "");
    else html.removeAttribute("data-page-loader-on");
  }, [showing]);

  if (!showing) return null;
  const main = document.getElementById("main-content");
  if (!main) return null;
  return createPortal(
    <div
      aria-busy="true"
      aria-label="Loading"
      // No z-index: the footer (and its top line, which reaches 1px up into
      // this area) stays drawn over it.
      className="absolute inset-0 flex items-center justify-center bg-background text-foreground"
      data-page-loader=""
      role="status"
    >
      <InfinityLoop className="size-10" />
    </div>,
    main,
  );
}
