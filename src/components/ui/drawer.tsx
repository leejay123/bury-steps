"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { overlayBackdropMotion, overlayMotionTransition } from "@/components/motion";
import {
  OverlayRootContext,
  restorePagePointerEvents,
  unlockIdleDocument,
  useOverlayPresence,
} from "@/components/overlay-root";

const overlayCloseClassName =
  "absolute top-2 right-2 z-20 flex size-11 cursor-pointer items-center justify-center rounded-md opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const DrawerOpenContext = React.createContext<boolean | undefined>(undefined);
const DrawerShouldRenderContext = React.createContext(true);
const DrawerCloseDisabledContext = React.createContext(false);
const DrawerTriggerRefContext = React.createContext<React.MutableRefObject<HTMLElement | null> | null>(
  null,
);

const DESKTOP_QUERY = "(min-width: 640px)";
const SAFARI_UA = /^((?!chrome|android).)*safari/i;

function isSafariBrowser() {
  return typeof navigator !== "undefined" && SAFARI_UA.test(navigator.userAgent);
}

/** iPhone / iPad Safari — desktop Safari does not need position:fixed (it hides the sticky header). */
function needsIosSafariBodyLock() {
  if (!isSafariBrowser()) return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPod|iPad/.test(ua)) return true;
  // iPadOS 13+ can report as Mac with touch.
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Body style props for the iOS Safari position:fixed scroll lock. */
const SAFARI_LOCK_PROPS = ["position", "top", "left", "right", "height", "width"] as const;
const OVERFLOW_LOCK_PROPS = ["overflow", "overflow-x", "overflow-y"] as const;

/**
 * iOS Safari locks scroll with position:fixed + top:-y. Clearing that and then
 * scrolling in a later frame paints one frame at y=0 (the flash/jump). Do both
 * in the same turn before paint.
 */
function lockIosSafariBodyScroll(y: number) {
  const { body } = document;
  body.style.setProperty("position", "fixed", "important");
  body.style.top = `${-y}px`;
  body.style.left = "0px";
  body.style.right = "0px";
  body.style.width = "100%";
  body.style.height = "auto";
}

function unlockIosSafariBodyScroll(y: number) {
  const { body } = document;
  const html = document.documentElement;
  const previousBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";

  for (const prop of SAFARI_LOCK_PROPS) {
    body.style.removeProperty(prop);
  }
  window.scrollTo(0, y);

  html.style.scrollBehavior = previousBehavior;
}

/** Desktop (incl. Mac Safari): overflow lock keeps sticky header in place. */
function lockOverflowScroll() {
  for (const node of [document.documentElement, document.body]) {
    node.style.overflow = "hidden";
  }
}

function unlockOverflowScroll() {
  for (const node of [document.documentElement, document.body]) {
    for (const prop of OVERFLOW_LOCK_PROPS) {
      node.style.removeProperty(prop);
    }
  }
}

/** Bottom sheet on phones, side panel from the sm breakpoint up. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(true);

  React.useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    setIsDesktop(media.matches);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

function Drawer({
  children,
  closeDisabled = false,
  direction,
  onOpenChange,
  open,
  repositionInputs = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /**
   * A form inside is mid-submit — a slow network shouldn't let someone
   * swipe/escape the sheet away while it's still saving. Without this the
   * save keeps running after the sheet is gone, and the success/error toast
   * fires later with nothing on screen to explain it.
   */
  closeDisabled?: boolean;
}) {
  // Only DrawerContent needs to stay mounted through the close animation
  // (see DrawerShouldRenderContext below). Gating `children` here as a whole
  // would also hide DrawerTrigger while `open` starts false and has never
  // been true, making the trigger permanently unclickable.
  const shouldRender = useOverlayPresence(open);
  const isDesktop = useIsDesktop();
  // Callers that need a specific direction (e.g. always-bottom pickers) can
  // still pass one explicitly; side drawers left unspecified become a bottom
  // sheet on phones and a side panel from the sm breakpoint up.
  const resolvedDirection = direction ?? (isDesktop ? "right" : "bottom");
  // iOS Safari needs a body scroll lock. We own it (noBodyStyles) so close can
  // unlock + scrollTo in one turn. Desktop Safari uses overflow:hidden instead
  // so the sticky header is not shifted off-screen.
  const scrollYRef = React.useRef(0);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const bodyLockRef = React.useRef<"ios" | "overflow" | null>(null);
  const closeCleanupTimerRef = React.useRef(0);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(closeCleanupTimerRef.current);
      if (bodyLockRef.current === "ios") {
        unlockIosSafariBodyScroll(scrollYRef.current);
      } else if (bodyLockRef.current === "overflow") {
        unlockOverflowScroll();
      }
      bodyLockRef.current = null;
      restorePagePointerEvents();
    };
  }, []);

  return (
    <DrawerOpenContext.Provider value={open}>
      <DrawerShouldRenderContext.Provider value={shouldRender}>
        <DrawerCloseDisabledContext.Provider value={closeDisabled}>
          <DrawerTriggerRefContext.Provider value={triggerRef}>
              <DrawerPrimitive.Root
                data-slot="drawer"
                {...props}
                direction={resolvedDirection}
                dismissible={!closeDisabled}
                modal
                // We apply Safari's position:fixed lock ourselves so restore is
                // synchronous. Leaving Vaul's lock on causes a one-frame jump.
                noBodyStyles
                onOpenChange={(next) => {
                  if (closeDisabled && !next) return;
                  window.clearTimeout(closeCleanupTimerRef.current);

                  if (next) {
                    scrollYRef.current = window.scrollY;
                    const active = document.activeElement;
                    triggerRef.current =
                      active instanceof HTMLElement ? active : triggerRef.current;
                    if (needsIosSafariBodyLock()) {
                      lockIosSafariBodyScroll(scrollYRef.current);
                      bodyLockRef.current = "ios";
                    } else {
                      lockOverflowScroll();
                      bodyLockRef.current = "overflow";
                    }
                  } else {
                    const lockedTop = document.body.style.top;
                    const fromLock = lockedTop
                      ? Math.abs(Number.parseInt(lockedTop, 10) || 0)
                      : 0;
                    const y = fromLock || scrollYRef.current;
                    scrollYRef.current = y;

                    if (bodyLockRef.current === "ios" || lockedTop) {
                      unlockIosSafariBodyScroll(y);
                    } else if (bodyLockRef.current === "overflow") {
                      unlockOverflowScroll();
                    }
                    bodyLockRef.current = null;

                    // Pointer-events / inert cleanup after the close animation —
                    // not in the same turn as scroll restore (that race flashed).
                    closeCleanupTimerRef.current = window.setTimeout(() => {
                      unlockIdleDocument();
                    }, 320);
                  }
                  onOpenChange?.(next);
                }}
                open={open}
                // Scaling the page behind the sheet looks like a zoom on iPhone.
                shouldScaleBackground={false}
                // Vaul's built-in keyboard/input repositioning has long-standing bugs
                // on iOS Safari (emilkowalski/vaul#619, #503, #514): the drawer can
                // get stuck mid-reposition — its content and overlay rendered in the
                // wrong place, or the overlay missing entirely — until the user taps
                // the screen again and forces a repaint. Disabling it and letting the
                // browser handle the on-screen keyboard natively (it still scrolls a
                // focused input into view) trades a slightly less polished animation
                // for a layout that never gets stuck.
                repositionInputs={repositionInputs}
              >
                {children}
              </DrawerPrimitive.Root>
          </DrawerTriggerRefContext.Provider>
        </DrawerCloseDisabledContext.Provider>
      </DrawerShouldRenderContext.Provider>
    </DrawerOpenContext.Provider>
  );
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  const triggerRef = React.useContext(DrawerTriggerRefContext);
  return (
    <DrawerPrimitive.Trigger
      data-slot="drawer-trigger"
      {...props}
      ref={(node) => {
        if (triggerRef) triggerRef.current = node;
        const { ref } = props as { ref?: React.Ref<HTMLButtonElement> };
        if (typeof ref === "function") ref(node);
        else if (ref && typeof ref === "object") {
          (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      }}
    />
  );
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  style,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  const open = React.useContext(DrawerOpenContext);
  const dismissed = open === false;
  const reduce = useReducedMotion();

  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed top-[var(--site-header-height)] right-0 bottom-0 left-0 z-[60] data-[state=closed]:invisible data-[state=closed]:!pointer-events-none data-[state=open]:pointer-events-auto",
        dismissed && "invisible !pointer-events-none",
        className,
      )}
      {...props}
      style={dismissed ? { ...style, pointerEvents: "none" } : { ...style, pointerEvents: "auto" }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        {...(reduce ? {} : overlayBackdropMotion)}
      />
    </DrawerPrimitive.Overlay>
  );
}

function DrawerContent({
  className,
  children,
  onEscapeKeyDown,
  onPointerDownOutside,
  showCloseButton = true,
  style,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & { showCloseButton?: boolean }) {
  const [root, setRoot] = React.useState<HTMLElement | null>(null);
  const open = React.useContext(DrawerOpenContext);
  const shouldRender = React.useContext(DrawerShouldRenderContext);
  const closeDisabled = React.useContext(DrawerCloseDisabledContext);
  const triggerRef = React.useContext(DrawerTriggerRefContext);
  const dismissed = open === false;
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (!root || open !== true) return;
    root.style.removeProperty("pointer-events");
  }, [open, root]);

  if (!shouldRender) return null;

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          // Vaul focuses this panel itself when it opens (there's no natural
          // first focusable element to land on otherwise), which makes
          // Safari draw its default blue focus ring around the whole sheet —
          // that's the "blue border" along the drawer's edge on iPhone.
          // Nothing inside needs *this* element's own outline; close/inputs
          // keep their own focus-visible rings.
          "group/drawer-content fixed z-[60] flex h-auto flex-col overflow-visible bg-background outline-hidden data-[state=closed]:invisible data-[state=closed]:!pointer-events-none data-[state=open]:pointer-events-auto",
          dismissed && "invisible !pointer-events-none",
          // Drawers portal straight to <body>, outside the shell that already
          // handles the Dynamic Island's left/right safe area, so each side
          // that sits flush against a screen edge needs its own inset here.
          // This also nudges the close button (positioned with top/right in
          // overlayCloseClassName) inward for free, since an absolutely
          // positioned child's offsets are measured from its ancestor's
          // padding edge.
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-[var(--site-header-height)] data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b data-[vaul-drawer-direction=top]:pl-[env(safe-area-inset-left)] data-[vaul-drawer-direction=top]:pr-[env(safe-area-inset-right)]",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=bottom]:pl-[env(safe-area-inset-left)] data-[vaul-drawer-direction=bottom]:pr-[env(safe-area-inset-right)]",
          "data-[vaul-drawer-direction=right]:top-[var(--site-header-height)] data-[vaul-drawer-direction=right]:bottom-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[calc(100%-1.25rem)] data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:pr-[env(safe-area-inset-right)] data-[vaul-drawer-direction=right]:sm:max-w-lg",
          "data-[vaul-drawer-direction=left]:top-[var(--site-header-height)] data-[vaul-drawer-direction=left]:bottom-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:h-auto data-[vaul-drawer-direction=left]:w-[calc(100%-1.25rem)] data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:pl-[env(safe-area-inset-left)] data-[vaul-drawer-direction=left]:sm:max-w-lg",
          className,
        )}
        onEscapeKeyDown={(event) => {
          if (closeDisabled) event.preventDefault();
          onEscapeKeyDown?.(event);
        }}
        onOpenAutoFocus={(event) => {
          // Don't land focus on an input as the sheet opens: on iPhone that
          // pops the keyboard during the enter animation and the drawer can
          // paint in the wrong place until the next tap.
          event.preventDefault();
          const panel = event.currentTarget;
          if (panel instanceof HTMLElement) panel.focus({ preventScroll: true });
          onOpenAutoFocus?.(event);
        }}
        onCloseAutoFocus={(event) => {
          // Safari's default focus restore scrolls the trigger into view.
          // Keep focus without moving the page; scroll was already restored
          // synchronously when the drawer began closing.
          event.preventDefault();
          const trigger = triggerRef?.current;
          if (trigger?.isConnected) trigger.focus({ preventScroll: true });
          onCloseAutoFocus?.(event);
        }}
        onPointerDownOutside={(event) => {
          if (closeDisabled) event.preventDefault();
          onPointerDownOutside?.(event);
        }}
        ref={setRoot}
        {...props}
        style={dismissed ? { ...style, pointerEvents: "none" } : { ...style, pointerEvents: "auto" }}
      >
        <OverlayRootContext.Provider value={root}>
          <motion.div
            className="flex min-h-0 flex-1 flex-col"
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: overlayMotionTransition,
                })}
          >
            <div className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
            {children}
            {showCloseButton ? (
              <DrawerPrimitive.Close
                aria-label="Close"
                className={overlayCloseClassName}
                data-slot="drawer-close"
                disabled={closeDisabled}
              >
                <X />
                <span className="sr-only">Close</span>
              </DrawerPrimitive.Close>
            ) : null}
          </motion.div>
        </OverlayRootContext.Provider>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 pr-12 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
