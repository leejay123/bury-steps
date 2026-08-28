"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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

/**
 * Cheap pre-check for whether anything actually needs restoring, so the
 * (unthrottled) call sites below — every pointerdown/keydown site-wide, a
 * MutationObserver callback, and a poll timer — can skip the ~30 style and
 * attribute writes in `restorePagePointerEvents` on the overwhelming
 * majority of calls where nothing is locked. Those writes touch <html>/
 * <body> directly, which is exactly the kind of main-thread work that can
 * steal frames from an in-progress CSS animation (e.g. an Accordion opening)
 * if it runs at the wrong moment, so it is worth skipping when there is
 * nothing to do.
 */
function isPageInteractionLocked() {
  const body = document.body;
  const html = document.documentElement;
  return (
    body.style.pointerEvents === "none" ||
    html.style.pointerEvents === "none" ||
    body.style.position === "fixed" ||
    body.style.top !== "" ||
    body.hasAttribute("data-scroll-locked") ||
    html.hasAttribute("data-scroll-locked") ||
    body.hasAttribute("inert") ||
    html.hasAttribute("inert") ||
    [...body.classList].some((className) => className.startsWith("block-interactivity-"))
  );
}

/** Radix/Vaul set this while a modal is open and sometimes leave it behind. */
export function restorePagePointerEvents() {
  if (!isPageInteractionLocked()) return;
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
  const viewportStyleRef = useRef<HTMLStyleElement>(null);

  useEffect(() => {
    // A route change means the previous page's tree is gone (or is about to
    // be). Any overlay that still reports `data-state="open"` at this point
    // belongs to a layout-level component (e.g. the notification bell) that
    // was left open rather than dismissed, and its lock must not survive
    // onto the new page. Restore unconditionally — do not gate this on
    // `anyOverlayLayerOpen()` like the other call sites, since that check can
    // itself be racing a same-tick "close on navigate" effect elsewhere and
    // would otherwise leave the new page permanently unclickable.
    neutralizeStaleOverlays();
    restorePagePointerEvents();
  }, [pathname]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const viewport = vv;

    let lastKeyboard = -1;
    let lastHeight = -1;

    function sync() {
      const style = viewportStyleRef.current;
      if (!style) return;
      const height = Math.round(viewport.height);
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      // Ignore the ~50–100px iOS URL-bar show/hide; a real keyboard is taller.
      const keyboard = inset > 120 ? Math.round(inset) : 0;
      // iOS can fire visualViewport "scroll" repeatedly during momentum
      // scrolling even when nothing actually changed. Rewriting a <style>
      // tag's textContent forces the browser to reparse that CSS text, so
      // skip it when the values are unchanged to avoid adding avoidable
      // main-thread work in the middle of a scroll gesture.
      if (keyboard === lastKeyboard && height === lastHeight) return;
      lastKeyboard = keyboard;
      lastHeight = height;
      style.textContent = `:root{--keyboard-inset:${keyboard}px;--vv-height:${height}px;}`;
    }

    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    window.addEventListener("orientationchange", sync);
    sync();
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

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

    // A scroll only happens when pointer-events are NOT blocked at the point
    // the user touched (native scrolling on mobile Safari is unaffected by
    // `pointer-events: none`, which is exactly the "scroll works, taps don't"
    // symptom this whole module exists to prevent). So a scroll is itself
    // evidence the page is at least partly interactive, and a good moment to
    // sweep for any stale lock left over elsewhere on the page. Debounced
    // separately (and more loosely) than the mutation observer so a scroll
    // gesture cannot spam this on every frame. Cheap now that
    // `restorePagePointerEvents` bails out immediately when nothing is
    // locked, so this can't add jank to the scroll it is reacting to.
    let scrollTimer = 0;
    function onScroll() {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(unlockIdleDocument, 150);
    }

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("popstate", unlockIdleDocument);
    // Covers the bfcache-restore case (swiping back on iOS Safari) where
    // neither popstate nor this effect's own mount necessarily rerun.
    window.addEventListener("pageshow", unlockIdleDocument);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    document.addEventListener("visibilitychange", unlockIdleDocument);
    const poll = window.setInterval(unlockIdleDocument, 400);

    unlockIdleDocument();

    return () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(scrollTimer);
      window.clearInterval(poll);
      observer.disconnect();
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("popstate", unlockIdleDocument);
      window.removeEventListener("pageshow", unlockIdleDocument);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("visibilitychange", unlockIdleDocument);
    };
  }, []);

  return <style ref={viewportStyleRef} />;
}
