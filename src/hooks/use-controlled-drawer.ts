"use client";

import { useCallback, useRef } from "react";

/**
 * Opening a controlled drawer from a list-row click in the same pointer
 * gesture can make Vaul treat the release as an outside dismiss. Defer the
 * open to the next task and briefly ignore outside pointer-down.
 */
export function useControlledDrawerDismissGuard() {
  const openingRef = useRef(false);

  const openSoon = useCallback((open: () => void) => {
    openingRef.current = true;
    window.setTimeout(() => {
      open();
      window.requestAnimationFrame(() => {
        openingRef.current = false;
      });
    }, 0);
  }, []);

  const onPointerDownOutside = useCallback((event: Event) => {
    if (openingRef.current) event.preventDefault();
  }, []);

  return { openSoon, onPointerDownOutside };
}
