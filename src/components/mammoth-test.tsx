"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SEARCH_COOKIE } from "@/lib/remembered-nav";
import { readPlaceholderStyle, subscribePlaceholderStyle } from "@/lib/placeholder-style";

const noopSubscribe = () => () => {};
const STYLESHEET = "/vendor/skeleton-mammoth-4.0.0.min.css";

/** Owners only (the header's owner-only search cookie marks them in this browser). */
function readIsOwner(): boolean {
  try {
    return new RegExp(`(?:^|; )${SEARCH_COOKIE}=1(?:;|$)`).test(document.cookie);
  } catch {
    return false;
  }
}

/** Marks our placeholders with Skeleton Mammoth's classes (or takes them off). */
function mark(on: boolean) {
  for (const el of Array.from(document.querySelectorAll("[data-page-loading]"))) {
    el.classList.toggle("sm-loading", on);
    if (on) el.setAttribute("data-sm-config", '{"animation":"wave"}');
    else el.removeAttribute("data-sm-config");
    for (const shape of Array.from(el.querySelectorAll('[data-slot="skeleton"]'))) {
      shape.classList.toggle("sm-item-primary", on);
    }
  }
}

/**
 * Temporary owner test: with "Skeleton Mammoth" picked (placeholder-style.ts),
 * the CSS library skeleton-mammoth draws its own skeleton (with its wave)
 * over each of our placeholder shapes, by adding its classes to them. Its
 * stylesheet, served from our own site, loads only once it's picked.
 */
export function MammothTest() {
  const owner = useSyncExternalStore(noopSubscribe, readIsOwner, () => false);
  const style = useSyncExternalStore(subscribePlaceholderStyle, readPlaceholderStyle, () => "grey" as const);
  const on = owner && style === "mammoth";

  useEffect(() => {
    if (!on) return;
    if (!document.querySelector(`link[href="${STYLESHEET}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = STYLESHEET;
      document.head.appendChild(link);
    }
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => mark(true));
    };
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { attributeFilter: ["data-page-loading"], childList: true, subtree: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      mark(false);
    };
  }, [on]);

  return null;
}
