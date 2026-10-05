"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OverlayRootContext,
  restorePagePointerEvents,
  unlockIdleDocument,
} from "@/components/overlay-root";
import { lockBackgroundScroll } from "@/components/overlay-scroll-lock";
import { mergeRefs } from "@/lib/merge-refs";

const overlayCloseClassName =
  "absolute top-3.5 right-3.5 z-20 flex size-8 cursor-pointer after:absolute after:-inset-1.5 items-center justify-center rounded-full opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

/**
 * Same motion as the Base UI drawer: the panel stays on its own layer, slides
 * fully on and fully off (450ms open, 300ms close), and the overlay opacity
 * follows the finger. The panel itself does not fade.
 */
const POPUP_MOTION =
  "pointer-events-auto fixed z-[60] m-[var(--drawer-inset,0px)] flex h-[var(--drawer-content-height)] max-h-[var(--drawer-content-max-height,none)] min-h-0 w-[var(--drawer-content-width,auto)] transform-[translate3d(var(--translate-x,0px),var(--translate-y,0px),0)_scale(var(--stack-scale))] flex-col transition-[transform,height,opacity,filter] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform outline-none select-none [interpolate-size:allow-keywords] data-nested-drawer-open:overflow-hidden data-nested-drawer-open:brightness-95 after:pointer-events-none after:absolute after:bg-[var(--drawer-bleed-background,var(--color-popover))] data-[swipe-axis=x]:after:inset-y-0 data-[swipe-axis=x]:after:w-[var(--bleed)] data-[swipe-axis=y]:after:inset-x-0 data-[swipe-axis=y]:after:h-[var(--bleed)] data-[swipe-direction=down]:after:top-full data-[swipe-direction=left]:after:right-full data-[swipe-direction=right]:after:left-full data-[swipe-direction=up]:after:bottom-full [--drawer-content-height:var(--drawer-height,auto)] data-[swipe-axis=x]:[--drawer-content-width:75%] data-[swipe-axis=x]:sm:[--drawer-content-width:28rem] data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-6rem)] data-[swipe-axis=y]:data-snap-points:[--drawer-content-height:100dvh] [--bleed:3rem] [--peek:1rem] [--stack-height:var(--drawer-frontmost-height,var(--drawer-height,0px))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] [--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--stack-shrink:calc(1-var(--stack-scale))] [--stack-step:0.05] data-ending-style:transform-[var(--closed-transform)] data-ending-style:opacity-[0.9999] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*300ms)] data-nested-drawer-swiping:duration-0 data-ending-style:data-nested-drawer-swiping:duration-[calc(var(--drawer-swipe-strength)*300ms)] data-starting-style:transform-[var(--closed-transform)] data-swiping:duration-0 data-ending-style:data-swiping:duration-[calc(var(--drawer-swipe-strength)*300ms)] data-[swipe-axis=y]:inset-x-0 data-[swipe-axis=y]:data-nested-drawer-open:h-[var(--stack-height)] data-[swipe-axis=x]:inset-y-0 data-[swipe-axis=x]:flex-row data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:origin-bottom data-[swipe-direction=down]:[--closed-transform:translate3d(0,calc(100%+var(--drawer-inset,0px)+2px),0)] data-[swipe-direction=down]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--stack-shrink)*var(--stack-height)))] data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:origin-top data-[swipe-direction=up]:[--closed-transform:translate3d(0,calc(-100%-var(--drawer-inset,0px)-2px),0)] data-[swipe-direction=up]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)+var(--stack-peek-offset)+(var(--stack-shrink)*var(--stack-height)))] data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:origin-left data-[swipe-direction=left]:[--closed-transform:translate3d(calc(-100%-var(--drawer-inset,0px)-2px),0,0)] data-[swipe-direction=left]:[--translate-x:calc(var(--drawer-swipe-movement-x)+var(--stack-peek-offset)+(var(--stack-shrink)*100%))] data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:origin-right data-[swipe-direction=right]:[--closed-transform:translate3d(calc(100%+var(--drawer-inset,0px)+2px),0,0)] data-[swipe-direction=right]:[--translate-x:calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)-(var(--stack-shrink)*100%))]";

const DrawerOpenContext = React.createContext(false);
const DrawerCloseDisabledContext = React.createContext(false);
const DrawerVariantContext = React.createContext<"sheet" | "form">("sheet");
const DrawerTriggerRefContext = React.createContext<React.MutableRefObject<HTMLElement | null> | null>(
  null,
);
const DrawerPointerOutsideRefContext = React.createContext<React.MutableRefObject<
  ((event: Event) => void) | null
> | null>(null);
const DrawerSwipeDirectionContext = React.createContext<"up" | "right" | "down" | "left">("right");

function useIsPhone() {
  const [phone, setPhone] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return phone;
}

// Open is 450ms. Close is 300ms, shorter on a fast swipe. Stay mounted
// a little past the close so it is not cut off.
const DRAWER_CLOSE_ANIMATION_MS = 500;

function toSwipeDirection(direction: "top" | "right" | "bottom" | "left" | undefined) {
  if (direction === "left") return "left" as const;
  if (direction === "bottom") return "down" as const;
  if (direction === "top") return "up" as const;
  return "right" as const;
}

function Drawer({
  children,
  closeDisabled = false,
  direction,
  onOpenChange,
  onOpenChangeComplete,
  open,
  variant = "sheet",
  ...props
}: Omit<React.ComponentProps<typeof DrawerPrimitive.Root>, "onOpenChange" | "swipeDirection"> & {
  closeDisabled?: boolean;
  direction?: "top" | "right" | "bottom" | "left";
  onOpenChange?: (open: boolean) => void;
  /**
   * `sheet` — the shared card (notices, About, Journey).
   * `form` — the same card and the same slide, but a swipe or a tap on the
   * page does not throw away what has been typed.
   */
  variant?: "sheet" | "form";
}) {
  const phone = useIsPhone();
  // On a phone every drawer rises from the bottom and closes downward.
  // On a wider screen a bottom sheet uses the side card instead.
  const requested = direction ?? "right";
  const swipeDirection = toSwipeDirection(phone ? "bottom" : requested === "bottom" ? "right" : requested);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const pointerOutsideRef = React.useRef<((event: Event) => void) | null>(null);
  const unlockBackgroundScrollRef = React.useRef<(() => void) | null>(null);
  const closeCleanupTimerRef = React.useRef(0);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const resolvedOpen = open ?? uncontrolledOpen;

  // Unlock in onOpenChangeComplete, not here: releasing overflow mid-close
  // brings the scrollbar back and reflows the page under the sliding panel.
  React.useLayoutEffect(() => {
    if (!resolvedOpen) return;
    unlockBackgroundScrollRef.current?.();
    unlockBackgroundScrollRef.current = lockBackgroundScroll();
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
    <DrawerOpenContext.Provider value={resolvedOpen}>
        <DrawerCloseDisabledContext.Provider value={closeDisabled}>
          <DrawerVariantContext.Provider value={variant}>
            <DrawerTriggerRefContext.Provider value={triggerRef}>
              <DrawerSwipeDirectionContext.Provider value={swipeDirection}>
              <DrawerPointerOutsideRefContext.Provider value={pointerOutsideRef}>
                <DrawerPrimitive.Root
                  data-slot="drawer"
                  disablePointerDismissal={closeDisabled || variant === "form"}
                  modal
                  onOpenChange={(next, eventDetails) => {
                    if (!next) {
                      const reason = eventDetails.reason;
                      if (closeDisabled) {
                        eventDetails.cancel();
                        return;
                      }
                      // Escape that already closed something inside the
                      // drawer — a dropdown or the date picker marks the key
                      // as handled — is spent. Closing the drawer too threw
                      // away everything typed in the form.
                      if (reason === "escape-key" && eventDetails.event?.defaultPrevented) {
                        eventDetails.cancel();
                        return;
                      }
                      if (variant === "form" && (reason === "swipe" || reason === "outside-press")) {
                        eventDetails.cancel();
                        return;
                      }
                      if (reason === "outside-press" && pointerOutsideRef.current) {
                        const event = new Event("pointerdown", { cancelable: true });
                        pointerOutsideRef.current(event);
                        if (event.defaultPrevented) {
                          eventDetails.cancel();
                          return;
                        }
                      }
                    }

                    window.clearTimeout(closeCleanupTimerRef.current);
                    if (open === undefined) setUncontrolledOpen(next);
                    if (next) {
                      const active = document.activeElement;
                      triggerRef.current = active instanceof HTMLElement ? active : triggerRef.current;
                    } else {
                      closeCleanupTimerRef.current = window.setTimeout(() => {
                        unlockIdleDocument();
                      }, DRAWER_CLOSE_ANIMATION_MS);
                    }
                    onOpenChange?.(next);
                  }}
                  onOpenChangeComplete={(next) => {
                    if (!next) {
                      unlockBackgroundScrollRef.current?.();
                      unlockBackgroundScrollRef.current = null;
                    }
                    onOpenChangeComplete?.(next);
                  }}
                  open={resolvedOpen}
                  swipeDirection={swipeDirection}
                  {...props}
                >
                  {children}
                </DrawerPrimitive.Root>
              </DrawerPointerOutsideRefContext.Provider>
              </DrawerSwipeDirectionContext.Provider>
            </DrawerTriggerRefContext.Provider>
          </DrawerVariantContext.Provider>
        </DrawerCloseDisabledContext.Provider>
    </DrawerOpenContext.Provider>
  );
}

function DrawerTrigger({
  asChild,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger> & { asChild?: boolean }) {
  const triggerRef = React.useContext(DrawerTriggerRefContext);
  if (asChild && React.isValidElement(children)) {
    return (
      <DrawerPrimitive.Trigger
        data-slot="drawer-trigger"
        ref={mergeRefs(triggerRef, ref)}
        render={children}
        {...props}
      />
    );
  }
  return (
    <DrawerPrimitive.Trigger data-slot="drawer-trigger" ref={mergeRefs(triggerRef, ref)} {...props}>
      {children}
    </DrawerPrimitive.Trigger>
  );
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return <DrawerPrimitive.Close data-slot="drawer-close" render={children} {...props} />;
  }
  return (
    <DrawerPrimitive.Close data-slot="drawer-close" {...props}>
      {children}
    </DrawerPrimitive.Close>
  );
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
  const open = React.useContext(DrawerOpenContext);
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      data-state={open ? "open" : "closed"}
      className={cn(
        // Same backdrop as the Base UI drawer: black/30 plus an 8px blur,
        // opacity only, so the blur fades with the dim. Fixed everywhere
        // except iOS, where it must be absolute to cover the browser chrome.
        // No transform on this layer — that drops the blur. z-60 sits above
        // the site header.
        "fixed inset-0 z-[60] min-h-dvh bg-black/30 opacity-[max(var(--drawer-overlay-min-opacity,0),calc(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] select-none supports-backdrop-filter:backdrop-blur-sm supports-[-webkit-touch-callout:none]:absolute data-ending-style:pointer-events-none data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*300ms)] data-snap-points:[--drawer-overlay-min-opacity:0.5] data-starting-style:opacity-0 data-swiping:duration-0",
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  onPointerDownOutside,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Popup> & {
  onPointerDownOutside?: (event: Event) => void;
  showCloseButton?: boolean;
}) {
  const [root, setRoot] = React.useState<HTMLElement | null>(null);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const open = React.useContext(DrawerOpenContext);
  const closeDisabled = React.useContext(DrawerCloseDisabledContext);
  const variant = React.useContext(DrawerVariantContext);
  const triggerRef = React.useContext(DrawerTriggerRefContext);
  const pointerOutsideRef = React.useContext(DrawerPointerOutsideRefContext);
  const swipeDirection = React.useContext(DrawerSwipeDirectionContext);
  const swipeAxis = swipeDirection === "down" || swipeDirection === "up" ? "y" : "x";

  React.useEffect(() => {
    if (!pointerOutsideRef) return;
    pointerOutsideRef.current = onPointerDownOutside ?? null;
    return () => {
      pointerOutsideRef.current = null;
    };
  }, [onPointerDownOutside, pointerOutsideRef]);

  React.useEffect(() => {
    if (!root) return;
    const panel = root;
    const viewport = window.visualViewport;
    let settleFrame = 0;
    // Scroll the field inside the drawer's own scroller. scrollIntoView also
    // pans the page, and on iOS that pan is what shrank the card to the
    // footer and slid the rest off the top of the screen.
    function scrollFieldIntoPanel(field: HTMLElement) {
      let scroller: HTMLElement | null = field.parentElement;
      while (scroller && panel.contains(scroller)) {
        const style = window.getComputedStyle(scroller);
        const scrolls = style.overflowY === "auto" || style.overflowY === "scroll";
        if (!scrolls) {
          scroller = scroller.parentElement;
          continue;
        }
        const viewportBottom = viewport ? viewport.height - 8 : window.innerHeight - 8;
        const box = scroller.getBoundingClientRect();
        const fieldRect = field.getBoundingClientRect();
        const limit = Math.min(box.bottom - 16, viewportBottom);
        if (fieldRect.bottom > limit) {
          scroller.scrollTop += fieldRect.bottom - limit;
        } else if (fieldRect.top < box.top + 16) {
          scroller.scrollTop -= box.top + 16 - fieldRect.top;
        }
        return;
      }
    }
    function alignFocusedField() {
      window.cancelAnimationFrame(settleFrame);
      settleFrame = window.requestAnimationFrame(() => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement) || !panel.contains(active)) return;
        if (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA" && active.tagName !== "SELECT") {
          return;
        }
        scrollFieldIntoPanel(active);
      });
    }
    panel.addEventListener("focusin", alignFocusedField);
    viewport?.addEventListener("resize", alignFocusedField);
    return () => {
      panel.removeEventListener("focusin", alignFocusedField);
      viewport?.removeEventListener("resize", alignFocusedField);
      window.cancelAnimationFrame(settleFrame);
    };
  }, [root]);

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Viewport
        data-modal="true"
        data-slot="drawer-viewport"
        className="pointer-events-none fixed inset-0 z-[60] select-none data-[modal=true]:pointer-events-auto"
      >
        <DrawerPrimitive.Popup
          data-drawer-variant={variant}
          data-slot="drawer-popup"
          data-swipe-axis={swipeAxis}
          className={cn(
            "group/drawer-popup",
            POPUP_MOTION,
            "bg-popover text-popover-foreground rounded-[24px] text-sm shadow-xl [--drawer-bleed-background:transparent] [--drawer-inset:0.5rem] max-sm:rounded-b-none max-sm:[--drawer-bleed-background:var(--color-popover)] max-sm:[--drawer-inset:0px]",
            className,
          )}
          finalFocus={() => triggerRef?.current ?? true}
          initialFocus={() => {
            popupRef.current?.focus({ preventScroll: true });
            return popupRef.current;
          }}
          ref={popupRef}
          {...props}
        >
          <DrawerPrimitive.Content
            data-base-ui-swipe-ignore={variant === "form" ? "" : undefined}
            data-drawer-variant={variant}
            data-slot="drawer-content"
            data-state={open ? "open" : "closed"}
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden overscroll-contain rounded-[inherit] select-text transition-opacity duration-300 ease-[cubic-bezier(0.45,1.005,0,1.005)] group-data-nested-drawer-open/drawer-popup:opacity-0 group-data-nested-drawer-swiping/drawer-popup:opacity-100 group-data-swiping/drawer-popup:select-none"
            ref={setRoot}
          >
            <OverlayRootContext.Provider value={root}>
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
            </OverlayRootContext.Provider>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("mb-3 flex shrink-0 flex-col gap-0.5 border-b p-4 pr-12 md:gap-1.5", className)}
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
