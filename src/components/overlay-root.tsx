"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

/** Drawer, dialog, and alert dialog set this so dropdowns open inside them. */
export const OverlayRootContext = createContext<HTMLElement | null>(null);

export function useOverlayRoot() {
  return useContext(OverlayRootContext);
}

const LOCK_STYLE_PROPS = [
  "pointer-events",
  "touch-action",
  "user-select",
  "-webkit-user-select",
  "cursor",
  "overflow",
  "overflow-x",
  "overflow-y",
  "position",
  "top",
  "left",
  "right",
  "width",
  "height",
  "padding-right",
  "margin-right",
] as const;

const OPEN_CONTENT_SELECTOR = [
  '[data-slot="drawer-content"][data-state="open"]',
  '[data-slot="dialog-content"][data-state="open"]',
  '[data-slot="alert-dialog-content"][data-state="open"]',
].join(", ");

/**
 * Every Radix DismissableLayer (Popover, the Popover-based Select, dropdown
 * menus, plus Dialog/AlertDialog/Drawer) temporarily sets
 * `document.body.style.pointerEvents = "none"` while it is open and restores
 * it itself on close. If we strip that style while one of these is still
 * open, Radix's own per-layer restore gets out of sync and can leave the
 * whole page permanently unclickable (scroll still works, since that is not
 * gated by pointer-events). So anything that can open a DismissableLayer must
 * be included here and treated as "do not touch body/html right now".
 */
const OPEN_LAYER_SELECTOR = [
  OPEN_CONTENT_SELECTOR,
  '[data-slot="drawer-overlay"][data-state="open"]',
  '[data-slot="dialog-overlay"][data-state="open"]',
  '[data-slot="alert-dialog-overlay"][data-state="open"]',
  '[data-slot="popover-content"][data-state="open"]',
  '[data-slot="dropdown-menu-content"][data-state="open"]',
  '[data-slot="dropdown-menu-sub-content"][data-state="open"]',
].join(", ");

const OVERLAY_SELECTOR = [
  '[data-slot="drawer-overlay"]',
  '[data-slot="dialog-overlay"]',
  '[data-slot="alert-dialog-overlay"]',
  '[data-slot="drawer-content"]',
  '[data-slot="dialog-content"]',
  '[data-slot="alert-dialog-content"]',
].join(", ");

function anyModalContentOpen() {
  return Boolean(document.querySelector(OPEN_CONTENT_SELECTOR));
}

function anyOverlayLayerOpen() {
  return Boolean(document.querySelector(OPEN_LAYER_SELECTOR));
}

/**
 * Open overlays must stay interactive. Earlier logic used geometry during Vaul's
 * enter animation and permanently set pointer-events:none on live drawers.
 *
 * Removing the inline override here is not enough: while a modal layer is
 * open, Radix sets `body.style.pointerEvents = "none"`, and "none" is
 * inherited by descendants. An open dialog/drawer with no override of its own
 * then inherits "none" from body and becomes unclickable — exactly what
 * happened opening a Select inside an AlertDialog. Force "auto" instead of
 * merely clearing the property, so open overlays are interactive regardless
 * of what body currently has set.
 */
function neutralizeStaleOverlays() {
  document.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR).forEach((node) => {
    const open = node.getAttribute("data-state") === "open";
    node.style.pointerEvents = open ? "auto" : "none";
  });
}

/** Radix/Vaul set this while a modal is open and sometimes leave it behind. */
export function restorePagePointerEvents() {
  const lockedTop = document.body.style.top;
  for (const node of [document.body, document.documentElement]) {
    for (const prop of LOCK_STYLE_PROPS) {
      node.style.removeProperty(prop);
    }
    node.removeAttribute("inert");
    node.removeAttribute("data-scroll-locked");
    node.removeAttribute("aria-hidden");
    for (const className of [...node.classList]) {
      if (className.startsWith("block-interactivity-")) node.classList.remove(className);
    }
  }
  if (lockedTop) {
    const y = Math.abs(Number.parseInt(lockedTop, 10) || 0);
    if (y) window.scrollTo(0, y);
  }
}

export function unlockIdleDocument() {
  neutralizeStaleOverlays();
  // Popovers, the Popover-based Select, and dropdown menus manage the same
  // body pointer-events lock themselves; touching it here would race them.
  if (anyOverlayLayerOpen()) return;
  restorePagePointerEvents();
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
      const timeout = window.setTimeout(() => setHeld(false), 200);
      return () => window.clearTimeout(timeout);
    }
  }, [open]);

  return open === undefined || Boolean(open) || held;
}

export function UnlockingLink({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href: string;
}) {
  function unlock() {
    // Never strip Vaul's body lock while a drawer/dialog is open — only clean
    // up after dismiss or navigation when nothing is open.
    unlockIdleDocument();
  }

  return (
    <Link className={className} href={href} onClick={unlock} onPointerDown={unlock}>
      {children}
    </Link>
  );
}

export function UnlockPageOnNavigate() {
  const pathname = usePathname();

  useEffect(() => {
    neutralizeStaleOverlays();
    if (!anyOverlayLayerOpen()) restorePagePointerEvents();
  }, [pathname]);

  useEffect(() => {
    let idleTimer = 0;

    function unlockSoon() {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(unlockIdleDocument, 50);
    }

    const observer = new MutationObserver(unlockSoon);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class", "data-scroll-locked", "inert", "aria-hidden"],
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    function shouldSkipUnlock(event: Event) {
      const target = event.target;
      return target instanceof Element && Boolean(target.closest(OPEN_LAYER_SELECTOR));
    }

    function onPointerDown(event: PointerEvent) {
      if (shouldSkipUnlock(event)) return;
      unlockIdleDocument();
    }

    function onPointerUp(event: PointerEvent) {
      if (shouldSkipUnlock(event)) return;
      unlockIdleDocument();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (shouldSkipUnlock(event)) return;
      unlockIdleDocument();
    }

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("popstate", unlockIdleDocument);
    document.addEventListener("visibilitychange", unlockIdleDocument);
    const poll = window.setInterval(unlockIdleDocument, 750);

    unlockIdleDocument();

    return () => {
      window.clearTimeout(idleTimer);
      window.clearInterval(poll);
      observer.disconnect();
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("popstate", unlockIdleDocument);
      document.removeEventListener("visibilitychange", unlockIdleDocument);
    };
  }, []);

  return null;
}
