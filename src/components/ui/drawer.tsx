"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import {
  OverlayRootContext,
  restorePagePointerEvents,
  unlockIdleDocument,
  useOverlayPresence,
} from "@/components/overlay-root";

const overlayCloseClassName =
  "absolute top-3 right-3 z-20 flex size-10 cursor-pointer items-center justify-center rounded-md opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const DrawerOpenContext = React.createContext<boolean | undefined>(undefined);
const DrawerShouldRenderContext = React.createContext(true);

const DESKTOP_QUERY = "(min-width: 640px)";

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
  direction,
  onOpenChange,
  open,
  repositionInputs = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
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

  React.useEffect(() => {
    return () => restorePagePointerEvents();
  }, []);

  return (
    <DrawerOpenContext.Provider value={open}>
      <DrawerShouldRenderContext.Provider value={shouldRender}>
        <DrawerPrimitive.Root
          data-slot="drawer"
          direction={resolvedDirection}
          dismissible
          modal
          onOpenChange={(next) => {
            if (!next) {
              unlockIdleDocument();
              window.setTimeout(unlockIdleDocument, 0);
              window.setTimeout(unlockIdleDocument, 250);
            }
            onOpenChange?.(next);
          }}
          open={open}
          // Vaul's built-in keyboard/input repositioning has long-standing bugs
          // on iOS Safari (emilkowalski/vaul#619, #503, #514): the drawer can
          // get stuck mid-reposition — its content and overlay rendered in the
          // wrong place, or the overlay missing entirely — until the user taps
          // the screen again and forces a repaint. Disabling it and letting the
          // browser handle the on-screen keyboard natively (it still scrolls a
          // focused input into view) trades a slightly less polished animation
          // for a layout that never gets stuck.
          repositionInputs={repositionInputs}
          {...props}
        >
          {children}
        </DrawerPrimitive.Root>
      </DrawerShouldRenderContext.Provider>
    </DrawerOpenContext.Provider>
  );
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
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
        "fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm data-[state=closed]:invisible data-[state=closed]:!pointer-events-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:pointer-events-auto",
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
  showCloseButton = true,
  style,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & { showCloseButton?: boolean }) {
  const [root, setRoot] = React.useState<HTMLElement | null>(null);
  const open = React.useContext(DrawerOpenContext);
  const shouldRender = React.useContext(DrawerShouldRenderContext);
  const dismissed = open === false;

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
          "group/drawer-content fixed z-[60] flex h-auto flex-col overflow-visible bg-background data-[state=closed]:invisible data-[state=closed]:!pointer-events-none data-[state=open]:pointer-events-auto",
          dismissed && "invisible !pointer-events-none",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:h-full data-[vaul-drawer-direction=right]:w-[calc(100%-1.25rem)] data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-lg",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:h-full data-[vaul-drawer-direction=left]:w-[calc(100%-1.25rem)] data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-lg",
          className,
        )}
        ref={setRoot}
        {...props}
        style={dismissed ? { ...style, pointerEvents: "none" } : { ...style, pointerEvents: "auto" }}
      >
        <OverlayRootContext.Provider value={root}>
          <div className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
          {children}
          {showCloseButton ? (
            <DrawerPrimitive.Close
              aria-label="Close"
              className={overlayCloseClassName}
              data-slot="drawer-close"
            >
              <X />
              <span className="sr-only">Close</span>
            </DrawerPrimitive.Close>
          ) : null}
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
