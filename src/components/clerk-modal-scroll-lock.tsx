"use client";

import { useEffect } from "react";
import { lockBackgroundScroll } from "@/components/overlay-scroll-lock";

/**
 * While one of Clerk's windows (Manage account) is open, the page behind it stays
 * still. Clerk only sets overflow:hidden on <body>, which Firefox ignores here (the
 * root has overflow-x: clip, so body's overflow doesn't reach the viewport), and which
 * never stops the dashboard's own scrolling frame (docs-main). So the site's own lock
 * — the one its drawers and dialogs use — holds for as long as Clerk's backdrop is on
 * the page. Clerk has no "opened" event, so this watches for the backdrop.
 */
export function ClerkModalScrollLock() {
  useEffect(() => {
    let release: (() => void) | null = null;
    const check = () => {
      const open = Boolean(document.querySelector(".cl-modalBackdrop"));
      if (open && !release) release = lockBackgroundScroll();
      else if (!open && release) {
        release();
        release = null;
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    check();
    return () => {
      observer.disconnect();
      release?.();
    };
  }, []);
  return null;
}
