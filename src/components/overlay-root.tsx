"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Drawer, dialog, and alert dialog set this so dropdowns open inside them. */
export const OverlayRootContext = createContext<HTMLElement | null>(null);

export function useOverlayRoot() {
  return useContext(OverlayRootContext);
}

/** Radix/Vaul set this while a modal is open and sometimes leave it behind. */
export function restorePagePointerEvents() {
  document.body.style.removeProperty("pointer-events");
  document.documentElement.style.removeProperty("pointer-events");
  for (const node of [document.body, document.documentElement]) {
    for (const className of [...node.classList]) {
      if (className.startsWith("block-interactivity-")) node.classList.remove(className);
    }
  }
}

/**
 * Keep portal contents mounted through the close animation, then drop them so a
 * stuck overlay cannot sit on top of the page and swallow every click.
 */
export function useOverlayPresence(open: boolean | undefined) {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (open) {
      setHeld(true);
      return;
    }
    if (open === false) {
      const timeout = window.setTimeout(() => setHeld(false), 500);
      return () => window.clearTimeout(timeout);
    }
  }, [open]);

  return open === undefined || Boolean(open) || held;
}

export function UnlockPageOnNavigate() {
  const pathname = usePathname();

  useEffect(() => {
    restorePagePointerEvents();
  }, [pathname]);

  return null;
}
