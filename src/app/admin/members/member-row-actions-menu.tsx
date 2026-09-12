"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import type React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const MenuActionSchedulerContext = createContext<((action: () => void) => void) | null>(null);

/**
 * For a DropdownMenuItem that opens a dialog/drawer: call the returned
 * function with that "open" callback from onSelect, instead of calling it
 * directly. See MemberRowActionsMenu for why. Returns null outside a
 * MemberRowActionsMenu (the `asMenuItem={false}` / standalone-Button path
 * never needs it — its onClick just calls setOpen(true) directly).
 */
export function useMenuActionScheduler() {
  return useContext(MenuActionSchedulerContext);
}

/**
 * Collapses a member row's less-common actions (Edit permissions, Make
 * owner, Cancel invite, Remove, …) behind a single "⋯" button, so a row
 * with several owner-only actions available doesn't turn into a wall of
 * buttons. The one action someone is most likely to want next (Make
 * organiser/member, Resend invite) stays a direct button next to this.
 *
 * Children must be rendered with `asMenuItem` (each action button accepts
 * that prop) so they render as plain DropdownMenuItem rows rather than as
 * buttons.
 *
 * `modal={false}`: a modal Radix menu locks background scroll the same way
 * Dialog/Drawer/AlertDialog do by default, which (per
 * overlay-scroll-lock.ts) breaks the sticky top nav — those other overlays
 * fight that with their own lockBackgroundScroll() pin; simplest here is to
 * just not engage Radix's own lock at all, since a "⋯" menu has no content
 * of its own worth trapping focus/scroll for.
 *
 * Opening a dialog/drawer from a menu item is the other tricky part: doing
 * it directly in onSelect races the newly-mounted dialog against the
 * menu's own close sequence (its exit animation is still playing, and
 * Radix moves focus back to the trigger once it finishes) — depending on
 * exactly when that lands, the dialog can lose focus (or get treated as an
 * "outside" interaction) the instant it appears and dismiss itself. A
 * plain `setTimeout` guess at "later" is not reliable, because it does not
 * actually wait for that close sequence.
 *
 * Instead: a menu item hands its "open the dialog" callback to `schedule`
 * (via useMenuActionScheduler) rather than calling it itself. That's held
 * here until DropdownMenuContent's `onCloseAutoFocus` fires — Radix's own
 * signal that the close (including the exit animation) has actually
 * finished and it is about to move focus — at which point the callback
 * runs instead of the default refocus, so the dialog opens into a menu
 * that is genuinely, completely gone.
 */
export function MemberRowActionsMenu({ children }: { children: React.ReactNode }) {
  const pendingActionRef = useRef<(() => void) | null>(null);
  const schedule = useCallback((action: () => void) => {
    pendingActionRef.current = action;
  }, []);

  return (
    <MenuActionSchedulerContext.Provider value={schedule}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button aria-label="More actions" size="xs" variant="outline">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          onCloseAutoFocus={() => {
            const action = pendingActionRef.current;
            pendingActionRef.current = null;
            action?.();
          }}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </MenuActionSchedulerContext.Provider>
  );
}
