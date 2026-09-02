"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { OverlayRootContext, unlockIdleDocument } from "@/components/overlay-root";
import { lockBackgroundScroll } from "@/components/overlay-scroll-lock";
import { useVisualViewportCenterY } from "@/hooks/use-visual-viewport-center";

function Dialog({
  onOpenChange,
  open,
  defaultOpen,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(Boolean(defaultOpen));
  const resolvedOpen = open ?? uncontrolledOpen;
  const unlockBackgroundScrollRef = React.useRef<(() => void) | null>(null);

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
      unlockBackgroundScrollRef.current?.();
      unlockBackgroundScrollRef.current = null;
    };
  }, []);

  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      defaultOpen={defaultOpen}
      onOpenChange={(next) => {
        if (open === undefined) setUncontrolledOpen(next);
        if (!next) {
          unlockIdleDocument();
          window.setTimeout(unlockIdleDocument, 0);
          window.setTimeout(unlockIdleDocument, 250);
        }
        onOpenChange?.(next);
      }}
      open={open}
      {...props}
    />
  );
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // Full-viewport blur over the frozen page (including the sticky header).
        // No opacity fade on backdrop-blur — that lag showed up on every browser.
        "fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm data-[state=closed]:invisible data-[state=closed]:!pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) {
  const [root, setRoot] = React.useState<HTMLElement | null>(null);
  const centerY = useVisualViewportCenterY();

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Radix focuses this panel itself on open, which makes Safari draw
          // its default blue focus ring around it; nothing inside needs this
          // element's own outline (the close button keeps its own).
          "bg-background outline-hidden data-[state=closed]:invisible data-[state=closed]:!pointer-events-none fixed top-[50%] left-[50%] z-[60] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-visible rounded-lg border p-6 shadow-lg sm:max-w-lg",
          className,
        )}
        ref={setRoot}
        // Overrides the top-[50%] class once the visual viewport has been
        // measured, so the keyboard opening (and the scroll that brings the
        // focused input into view above it) can't drag this out of the area
        // that's actually visible. See the hook's own doc comment.
        style={centerY === null ? style : { ...style, top: `${centerY}px` }}
        {...props}
      >
        <OverlayRootContext.Provider value={root}>
          {children}
          {showCloseButton ? (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              aria-label="Close"
              className="absolute top-2 right-2 z-10 flex size-11 cursor-pointer items-center justify-center rounded-md opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <X />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          ) : null}
        </OverlayRootContext.Provider>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      // Equal side padding on small screens so text-center is visually centred
      // despite the absolute close button; desktop stays left-aligned.
      className={cn("flex flex-col gap-2 px-8 text-center sm:px-0 sm:pr-11 sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-lg leading-none font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
