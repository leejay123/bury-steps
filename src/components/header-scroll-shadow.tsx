"use client";

import { useEffect } from "react";

/** Marks the site header once the page has scrolled, so it can show a soft shadow while stuck. */
export function HeaderScrollShadow() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("header[data-site-header]");
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.toggleAttribute("data-scrolled", window.scrollY > 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
