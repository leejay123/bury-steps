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
  "absolute top-2 right-2 z-20 flex size-11 cursor-pointer items-center justify-center rounded-md opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

/**
 * Same motion as the shadcn Base UI drawer (the cart panel): 450ms,
 * cubic-bezier(0.22, 1, 0.36, 1), no transition while a finger is down,
 * and a close that speeds up with the swipe. Do not shorten these.
 */
const POPUP_MOTION =
  "pointer-events-auto fixed z-[60] m-[var(--drawer-inset,0px)] flex h-[var(--drawer-content-height)] max-h-[var(--drawer-content-max-height,none)] min-h-0 w-[var(--drawer-content-width,auto)] transform-[translate3d(var(--translate-x,0px),var(--translate-y,0px),0)_scale(var(--stack-scale))] flex-col transition-[transform,opacity,filter] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform outline-none select-none [interpolate-size:allow-keywords] data-nested-drawer-open:overflow-hidden data-nested-drawer-open:brightness-95 after:pointer-events-none after:absolute after:bg-[var(--drawer-bleed-background,var(--color-popover))] data-[swipe-axis=x]:after:inset-y-0 data-[swipe-axis=x]:after:w-[var(--bleed)] data-[swipe-axis=y]:after:inset-x-0 data-[swipe-axis=y]:after:h-[var(--bleed)] data-[swipe-direction=down]:after:top-full data-[swipe-direction=left]:after:right-full data-[swipe-direction=right]:after:left-full data-[swipe-direction=up]:after:bottom-full [--drawer-content-height:var(--drawer-height,auto)] data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-6rem)] data-[swipe-axis=y]:data-snap-points:[--drawer-content-height:100dvh] [--bleed:3rem] [--peek:1rem] [--stack-height:var(--drawer-frontmost-height,var(--drawer-height,0px))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] [--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--stack-shrink:calc(1-var(--stack-scale))] [--stack-step:0.05] data-ending-style:transform-[var(--closed-transform)] data-ending-style:opacity-[0.9999] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-nested-drawer-swiping:duration-0 data-ending-style:data-nested-drawer-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:transform-[var(--closed-transform)] data-swiping:duration-0 data-ending-style:data-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-[swipe-axis=y]:inset-x-0 data-[swipe-axis=y]:data-nested-drawer-open:h-[var(--stack-height)] data-[swipe-axis=x]:inset-y-0 data-[swipe-axis=x]:flex-row data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:origin-bottom data-[swipe-direction=down]:[--closed-transform:translate3d(0,calc(100%+var(--drawer-inset,0px)+2px),0)] data-[swipe-direction=down]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--stack-shrink)*var(--stack-height)))] data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:origin-top data-[swipe-direction=up]:[--closed-transform:translate3d(0,calc(-100%-var(--drawer-inset,0px)-2px),0)] data-[swipe-direction=up]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)+var(--stack-peek-offset)+(var(--stack-shrink)*var(--stack-height)))] data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:origin-left data-[swipe-direction=left]:[--closed-transform:translate3d(calc(-100%-var(--drawer-inset,0px)-2px),0,0)] data-[swipe-direction=left]:[--translate-x:calc(var(--drawer-swipe-movement-x)+var(--stack-peek-offset)+(var(--stack-shrink)*100%))] data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:origin-right data-[swipe-direction=right]:[--closed-transform:translate3d(calc(100%+var(--drawer-inset,0px)+2px),0,0)] data-[swipe-direction=right]:[--translate-x:calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)-(var(--stack-shrink)*100%))]";

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
const DrawerPhoneContext = React.createContext(false);

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

// A click-to-close is 450ms. A fast swipe shortens that (strength × 400ms).
// Stay mounted a little past the longer of the two.
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
  const swipeDirection = toSwipeDirection(direction ?? "right");
  const phone = useIsPhone();
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const pointerOutsideRef = React.useRef<((event: Event) => void) | null>(null);
  const unlockBackgroundScrollRef = React.useRef<(() => void) | null>(null);
  const closeCleanupTimerRef = React.useRef(0);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const resolvedOpen = open ?? uncontrolledOpen;

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
    <DrawerOpenContext.Provider value={resolvedOpen}>
        <DrawerCloseDisabledContext.Provider value={closeDisabled}>
          <DrawerVariantContext.Provider value={variant}>
            <DrawerTriggerRefContext.Provider value={triggerRef}>
              <DrawerSwipeDirectionContext.Provider value={swipeDirection}>
              <DrawerPhoneContext.Provider value={phone}>
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
                      if (phone && reason === "swipe") {
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
                  open={resolvedOpen}
                  swipeDirection={swipeDirection}
                  {...props}
                >
                  {children}
                </DrawerPrimitive.Root>
              </DrawerPointerOutsideRefContext.Provider>
              </DrawerPhoneContext.Provider>
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
        // Same full-screen blur as dialogs. Do not fade this layer's opacity:
        // animating a backdrop-filter is what made the slide stutter. Hide it
        // as soon as the drawer closes so the blur cannot stay after the panel
        // has slid away.
        "fixed inset-0 z-[60] min-h-dvh bg-black/30 backdrop-blur-sm [transform:translateZ(0)] will-change-transform select-none data-[state=closed]:invisible data-[state=closed]:pointer-events-none data-[state=closed]:backdrop-blur-none supports-[-webkit-touch-callout:none]:absolute",
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
  const phone = React.useContext(DrawerPhoneContext);
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
    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }
    const viewport = window.visualViewport;
    let settleFrame = 0;
    function onViewportResize() {
      window.cancelAnimationFrame(settleFrame);
      settleFrame = window.requestAnimationFrame(() => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement) || !root?.contains(active)) return;
        if (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA") return;
        active.scrollIntoView({ block: "nearest" });
      });
    }
    root.addEventListener("focusin", onFocusIn);
    viewport?.addEventListener("resize", onViewportResize);
    return () => {
      root.removeEventListener("focusin", onFocusIn);
      viewport?.removeEventListener("resize", onViewportResize);
      window.cancelAnimationFrame(settleFrame);
    };
  }, [root]);

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className="pointer-events-none fixed inset-0 z-[60] select-none data-[modal=true]:pointer-events-auto"
      >
        <DrawerPrimitive.Popup
          data-base-ui-swipe-ignore={phone ? "" : undefined}
          data-drawer-variant={variant}
          data-slot="drawer-popup"
          data-swipe-axis={swipeAxis}
          className={cn(
            "group/drawer-popup",
            POPUP_MOTION,
            // One size for every drawer. The visible card is the inner content,
            // inset by 1rem, so notices and editors match.
            "m-0 border-0 bg-transparent shadow-none [--drawer-bleed-background:transparent] [--drawer-inset:0px] [--drawer-content-width:min(32rem,calc(100vw-2rem))]",
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
            className="relative m-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden overscroll-contain rounded-2xl border bg-popover text-popover-foreground shadow-2xl select-text transition-opacity duration-300 ease-[cubic-bezier(0.45,1.005,0,1.005)] group-data-nested-drawer-open/drawer-popup:opacity-0 group-data-nested-drawer-swiping/drawer-popup:opacity-100 group-data-swiping/drawer-popup:select-none"
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
      className={cn("flex shrink-0 flex-col gap-0.5 p-4 pr-12 md:gap-1.5", className)}
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
