"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { overlayBackdropMotion, overlayMotionTransition } from "@/components/motion";
import { OverlayRootContext, unlockIdleDocument } from "@/components/overlay-root";

function Dialog({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      onOpenChange={(open) => {
        if (!open) {
          unlockIdleDocument();
          window.setTimeout(unlockIdleDocument, 0);
          window.setTimeout(unlockIdleDocument, 250);
        }
        onOpenChange?.(open);
      }}
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
  const reduce = useReducedMotion();

  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed top-[var(--site-header-height)] right-0 bottom-0 left-0 z-[60] data-[state=closed]:invisible data-[state=closed]:!pointer-events-none",
        className,
      )}
      {...props}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        {...(reduce ? {} : overlayBackdropMotion)}
      />
    </DialogPrimitive.Overlay>
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) {
  const [root, setRoot] = React.useState<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className="outline-hidden data-[state=closed]:invisible data-[state=closed]:!pointer-events-none fixed top-[50%] left-[50%] z-[60] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-visible border-0 bg-transparent p-0 shadow-none"
        ref={setRoot}
        {...props}
      >
        <OverlayRootContext.Provider value={root}>
          <motion.div
            className={cn(
              "bg-background relative grid w-full gap-4 overflow-visible rounded-lg border p-6 shadow-lg sm:max-w-lg",
              className,
            )}
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: overlayMotionTransition,
                })}
          >
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
          </motion.div>
        </OverlayRootContext.Provider>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 pr-11 text-center sm:text-left", className)}
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
