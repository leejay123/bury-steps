"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { OverlayRootContext, unlockIdleDocument } from "@/components/overlay-root";
import { lockBackgroundScroll } from "@/components/overlay-scroll-lock";

const AlertDialogCloseDisabledContext = React.createContext(false);

function AlertDialog({
  closeDisabled = false,
  onOpenChange,
  open,
  defaultOpen,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root> & {
  /**
   * A form inside is mid-submit. Blocks X / Escape, and does not bounce a
   * successful `setOpen(false)` back open if Radix fires onOpenChange(false)
   * while pending is still true.
   */
  closeDisabled?: boolean;
}) {
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
    <AlertDialogCloseDisabledContext.Provider value={closeDisabled}>
      <AlertDialogPrimitive.Root
        data-slot="alert-dialog"
        defaultOpen={defaultOpen}
        onOpenChange={(next) => {
          if (closeDisabled && !next) return;
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
    </AlertDialogCloseDisabledContext.Provider>
  );
}

function AlertDialogTrigger(props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal(props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm data-[state=closed]:invisible data-[state=closed]:!pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  children,
  closeDisabled,
  onEscapeKeyDown,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  closeDisabled?: boolean;
  showCloseButton?: boolean;
}) {
  const fromRoot = React.useContext(AlertDialogCloseDisabledContext);
  const blocked = Boolean(closeDisabled || fromRoot);
  const [root, setRoot] = React.useState<HTMLElement | null>(null);

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          // Radix focuses this panel itself on open, which makes Safari draw
          // its default blue focus ring around it; nothing inside needs this
          // element's own outline (the close/cancel buttons keep their own).
          "bg-background outline-hidden data-[state=closed]:invisible data-[state=closed]:!pointer-events-none fixed top-[50%] left-[50%] z-[70] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-visible rounded-lg border p-6 shadow-lg sm:max-w-lg",
          className,
        )}
        onEscapeKeyDown={(event) => {
          if (blocked) event.preventDefault();
          onEscapeKeyDown?.(event);
        }}
        ref={setRoot}
        {...props}
      >
        <OverlayRootContext.Provider value={root}>
          {children}
          {showCloseButton ? (
            <AlertDialogPrimitive.Cancel
              aria-label="Close"
              className="absolute top-2 right-2 z-10 flex size-11 cursor-pointer items-center justify-center rounded-md opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              disabled={blocked}
            >
              <X />
              <span className="sr-only">Close</span>
            </AlertDialogPrimitive.Cancel>
          ) : null}
        </OverlayRootContext.Provider>
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 pr-11 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title data-slot="alert-dialog-title" className={cn("text-lg font-semibold", className)} {...props} />;
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...props} />;
}

function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />;
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
