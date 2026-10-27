"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { InfinityLoop } from "@/components/ui/infinity-loop";
import { readPlaceholderPreview } from "@/lib/placeholder-preview-cookie";

// If a page never arrives (a lost connection, an error), the cover steps
// aside after this long instead of hiding the page for ever — except while
// an owner is previewing the loading screen (Placeholders: Always).
const GIVE_UP_MS = 20_000;

// Every page's loading placeholder (loading.tsx and the loading fallbacks).
const PLACEHOLDER = "[data-page-loading]";

/**
 * The loading screen: while any part of the page is still loading (a
 * placeholder marked data-page-loading is on screen), a blank screen with
 * loading-ui's Infinity loader in the middle covers everything, header and
 * phone bar too, until the page has arrived. Owners' Placeholders button
 * stays on top, so a held preview can be turned off.
 */
export function PageLoader() {
  const [loading, setLoading] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

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

  if (!loading || gaveUp) return null;
  return createPortal(
    <div
      aria-busy="true"
      aria-label="Loading"
      className="fixed inset-0 z-[58] flex items-center justify-center bg-background text-foreground"
      data-page-loader=""
      role="status"
    >
      <InfinityLoop className="size-20" />
    </div>,
    document.body,
  );
}
