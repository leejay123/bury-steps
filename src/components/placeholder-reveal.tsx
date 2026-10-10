"use client";

import { useEffect } from "react";

/** Same feel as the Members list reveal (spectrumui/skeleton-reveal): 400ms from a 2px blur. */
const REVEAL_CLASS = "bs-reveal";
const LISTS = "[data-reveal-list], [data-reveal-card], table";

/**
 * When a page's list placeholder (anything marked data-page-loading) gives
 * way to the real lists, those lists fade in from a slight blur instead of
 * snapping in. Content that arrives without a placeholder isn't touched,
 * and nothing is held back: the fade starts the moment the content is there.
 * React already keeps a placeholder up long enough not to blink.
 */
export function PlaceholderReveal() {
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let loading = !!main.querySelector("[data-page-loading]");
    const observer = new MutationObserver(() => {
      const now = !!main.querySelector("[data-page-loading]");
      if (loading && !now) {
        for (const el of main.querySelectorAll<HTMLElement>(LISTS)) {
          if (el.closest(`.${REVEAL_CLASS}`)) continue;
          el.classList.add(REVEAL_CLASS);
          el.addEventListener("animationend", () => el.classList.remove(REVEAL_CLASS), { once: true });
        }
      }
      loading = now;
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
