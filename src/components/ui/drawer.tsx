"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { overlayMotionTransition } from "@/components/motion";
import {
  OverlayRootContext,
  restorePagePointerEvents,
  unlockIdleDocument,
  useOverlayPresence,
} from "@/components/overlay-root";
import { lockBackgroundScroll } from "@/components/overlay-scroll-lock";
import { mergeRefs } from "@/lib/merge-refs";

const overlayCloseClassName =
  "absolute top-2 right-2 z-20 flex size-11 cursor-pointer items-center justify-center rounded-md opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const DrawerOpenContext = React.createContext<boolean | undefined>(undefined);
const DrawerShouldRenderContext = React.createContext(true);
const DrawerCloseDisabledContext = React.createContext(false);
const DrawerVariantContext = React.createContext<"sheet" | "form">("sheet");
const DrawerTriggerRefContext = React.createContext<React.MutableRefObject<HTMLElement | null> | null>(
  null,
);

const DESKTOP_QUERY = "(min-width: 640px)";

function subscribeToDesktopQuery(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Bottom sheet on phones, side panel from the sm breakpoint up. */
function useIsDesktop() {
  return React.useSyncExternalStore(
    subscribeToDesktopQuery,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    // No matchMedia on the server — match the old default so hydration agrees.
    () => true,
  );
}

function Drawer({
  children,
  closeDisabled = false,
  direction,
  onOpenChange,
  open,
  repositionInputs = false,
  /**
   * `sheet` — bottom sheet on phones (lists, confirms, read-only).
   * `form` — full-height panel on phones too, so the keyboard does not fight a
   * short bottom sheet (notices, reports, homepage editors).
   */
  variant = "sheet",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  closeDisabled?: boolean;
  variant?: "sheet" | "form";
}) {
  // Only DrawerContent needs to stay mounted through the close animation
  // (see DrawerShouldRenderContext below). Gating `children` here as a whole
  // would also hide DrawerTrigger while `open` starts false and has never
  // been true, making the trigger permanently unclickable.
  const shouldRender = useOverlayPresence(open);
  const isDesktop = useIsDesktop();
  // Form editors stay a side/full panel on every width. Short sheets still
  // rise from the bottom on phones.
  const resolvedDirection =
    direction ?? (variant === "form" || isDesktop ? "right" : "bottom");
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const unlockBackgroundScrollRef = React.useRef<(() => void) | null>(null);
  const closeCleanupTimerRef = React.useRef(0);
  // Uncontrolled drawers (e.g. homepage Read more) never pass `open`. Track
  // Vaul's open state so the header pin still runs for them.
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const resolvedOpen = open ?? uncontrolledOpen;

  // Pin from the open flag itself — admin drawers often open with setState
  // (setMode) and never fire onOpenChange(true), which used to skip the pin.
  // useLayoutEffect so the pin lands before paint (less flash than useEffect).
  React.useLayoutEffect(() => {
    if (!resolvedOpen) {
      unlockBackgroundScrollRef.current?.();
      unlockBackgroundScrollRef.current = null;
      return;
    }
    unlockBackgroundScrollRef.current?.();
    unlockBackgroundScrollRef.current = lockBackgroundScroll();
    return () => {
      unlockBackgroundScrollRef.current?.();
      unlockBackgroundScrollRef.current = null;
    };
  }, [resolvedOpen]);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(closeCleanupTimerRef.current);
      unlockBackgroundScrollRef.current?.();
      unlockBackgroundScrollRef.current = null;
      restorePagePointerEvents();
    };
  }, []);

  return (
    <DrawerOpenContext.Provider value={open}>
      <DrawerShouldRenderContext.Provider value={shouldRender}>
        <DrawerCloseDisabledContext.Provider value={closeDisabled}>
          <DrawerVariantContext.Provider value={variant}>
            <DrawerTriggerRefContext.Provider value={triggerRef}>
              <DrawerPrimitive.Root
                data-slot="drawer"
                {...props}
                direction={resolvedDirection}
                dismissible={!closeDisabled}
                modal
                // Do not let Vaul apply position:fixed on <body> — that is what
                // dragged the sticky header off-screen under the blur on every
                // Safari/iOS path. RemoveScroll still locks overflow.
                noBodyStyles
                onOpenChange={(next) => {
                  if (closeDisabled && !next) return;
                  window.clearTimeout(closeCleanupTimerRef.current);

                  if (open === undefined) setUncontrolledOpen(next);

                  if (next) {
                    const active = document.activeElement;
                    triggerRef.current =
                      active instanceof HTMLElement ? active : triggerRef.current;
                  } else {
                    // Pointer-events / inert cleanup after the close animation —
                    // not in the same turn as dismiss (that race flashed).
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
          </DrawerVariantContext.Provider>
        </DrawerCloseDisabledContext.Provider>
      </DrawerShouldRenderContext.Provider>
    </DrawerOpenContext.Provider>
  );
}

function DrawerTrigger({
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  const triggerRef = React.useContext(DrawerTriggerRefContext);
  return (
    <DrawerPrimitive.Trigger
      data-slot="drawer-trigger"
      {...props}
      ref={mergeRefs(triggerRef, ref)}
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

  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        // Full-viewport blur: page and header stay put underneath; nothing
        // peeks above the dim layer. Blur is applied immediately — fading
        // opacity on a backdrop-filter layer is what lagged on every browser.
        "fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm data-[state=closed]:invisible data-[state=closed]:!pointer-events-none data-[state=open]:pointer-events-auto",
        dismissed && "invisible !pointer-events-none",
        className,
      )}
      {...props}
      style={dismissed ? { ...style, pointerEvents: "none" } : { ...style, pointerEvents: "auto" }}
    />
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
  const variant = React.useContext(DrawerVariantContext);
  const triggerRef = React.useContext(DrawerTriggerRefContext);
  const dismissed = open === false;
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (!root || open !== true) return;
    root.style.removeProperty("pointer-events");

    // When a field is focused, scroll it into the sheet's scrollport so it
    // isn't hidden under the sticky footer or clipped by the keyboard.
    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }

    root.addEventListener("focusin", onFocusIn);
    return () => root.removeEventListener("focusin", onFocusIn);
  }, [open, root]);

  if (!shouldRender) return null;

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-drawer-variant={variant}
        data-slot="drawer-content"
        className={cn(
          // Vaul focuses this panel itself when it opens (there's no natural
          // first focusable element to land on otherwise), which makes
          // Safari draw its default blue focus ring around the whole sheet —
          // that's the "blue border" along the drawer's edge on iPhone.
          // Nothing inside needs *this* element's own outline; close/inputs
          // keep their own focus-visible rings.
          "group/drawer-content fixed z-[60] flex h-auto flex-col overflow-hidden bg-background outline-hidden data-[state=closed]:invisible data-[state=closed]:!pointer-events-none data-[state=open]:pointer-events-auto",
          dismissed && "invisible !pointer-events-none",
          // Drawers portal straight to <body>, outside the shell that already
          // handles the Dynamic Island's left/right safe area, so each side
          // that sits flush against a screen edge needs its own inset here.
          // This also nudges the close button (positioned with top/right in
          // overlayCloseClassName) inward for free, since an absolutely
          // positioned child's offsets are measured from its ancestor's
          // padding edge.
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b data-[vaul-drawer-direction=top]:pt-[env(safe-area-inset-top)] data-[vaul-drawer-direction=top]:pl-[env(safe-area-inset-left)] data-[vaul-drawer-direction=top]:pr-[env(safe-area-inset-right)]",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=bottom]:pl-[env(safe-area-inset-left)] data-[vaul-drawer-direction=bottom]:pr-[env(safe-area-inset-right)]",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:h-full data-[vaul-drawer-direction=right]:w-[calc(100%-1.25rem)] data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:pt-[env(safe-area-inset-top)] data-[vaul-drawer-direction=right]:pr-[env(safe-area-inset-right)] data-[vaul-drawer-direction=right]:sm:max-w-lg",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:h-full data-[vaul-drawer-direction=left]:w-[calc(100%-1.25rem)] data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:pt-[env(safe-area-inset-top)] data-[vaul-drawer-direction=left]:pl-[env(safe-area-inset-left)] data-[vaul-drawer-direction=left]:sm:max-w-lg",
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
      className={cn("mt-auto flex shrink-0 flex-col gap-2 border-t bg-background p-4", className)}
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
