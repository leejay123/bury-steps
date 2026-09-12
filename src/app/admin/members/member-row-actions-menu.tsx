"use client";

import type React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/**
 * Collapses a member row's less-common actions (Edit permissions, Make
 * owner, Cancel invite, Remove, …) behind a single "⋯" button, so a row
 * with several owner-only actions available doesn't turn into a wall of
 * buttons. The one action someone is most likely to want next (Make
 * organiser/member, Resend invite) stays a direct button next to this.
 *
 * Children must be rendered with `asMenuItem` (each action button accepts
 * that prop) so they render as plain DropdownMenuItem rows rather than as
 * buttons — Radix's Item closes the menu on select on its own, same as any
 * other menu, and each item's own onSelect opens its dialog/drawer on top
 * of that, same as clicking it standalone would (deferred a tick — see the
 * comment on each button's `asMenuItem` branch).
 *
 * `modal={false}`: a modal Radix menu locks background scroll the same way
 * Dialog/Drawer/AlertDialog do by default, which (per
 * overlay-scroll-lock.ts) breaks the sticky top nav — those other overlays
 * fight that with their own lockBackgroundScroll() pin; simplest here is to
 * just not engage Radix's own lock at all, since a "⋯" menu has no content
 * of its own worth trapping focus/scroll for.
 */
export function MemberRowActionsMenu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button aria-label="More actions" size="xs" variant="outline">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A DropdownMenuItem's onSelect that opens a dialog/drawer should call this
 * instead of `setOpen(true)` directly. Opening it in the very same tick that
 * Radix is also closing the menu races the dialog's own outside-click
 * detection against that still-in-flight click, which can dismiss the
 * dialog the instant it appears. Deferring to the next tick lets the menu's
 * close finish first.
 */
export function openAfterMenuCloses(setOpen: (open: boolean) => void) {
  setTimeout(() => setOpen(true), 0);
}
