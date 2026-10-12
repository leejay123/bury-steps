"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A button that opens the walk's other controls as a list floating over
 * the page, one per line like a menu (Manage in D and H3, More in H1), so nothing underneath moves
 * when it opens — an in-page panel pushed the tabs down and made the
 * sliding tab line jump.
 *
 * The controls stay mounted while it's closed (only hidden): their confirm
 * boxes (Remove walk, Cancel walk…) are children of them, so closing the
 * panel as one opens must not remove it. Clicks inside an open confirm box
 * don't close the panel either.
 */
export function WalkManageMenu({ children, label }: { children: ReactNode; label: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const insideDialog = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest('[role="dialog"], [role="alertdialog"]'));
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current?.contains(event.target as Node) || insideDialog(event.target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <Button
        aria-controls={panelId}
        aria-expanded={open}
        className="w-full sm:w-auto"
        onClick={() => setOpen((value) => !value)}
        size="sm"
        type="button"
        variant="outline"
      >
        {label}
      </Button>
      <div
        className={cn(
          "absolute top-full right-0 left-0 z-30 mt-1 flex flex-col rounded-md border bg-popover p-1 text-popover-foreground shadow-md sm:left-auto sm:w-64",
          !open && "hidden",
        )}
        // A plain list, one action per line, like a menu (globals.css, [data-manage-menu]).
        data-manage-menu=""
        id={panelId}
      >
        {children}
      </div>
    </div>
  );
}
