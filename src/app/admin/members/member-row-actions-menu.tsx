"use client";

import type React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/**
 * A single "⋯" button collapsing a member row's less-common actions (Edit
 * permissions, Make owner, Cancel invite, Remove, …), so a row with several
 * owner-only actions available doesn't turn into a wall of buttons. The one
 * action someone is most likely to want next (Make organiser/member, Resend
 * invite) stays a direct button next to this.
 *
 * `children` here must be plain DropdownMenuItems — never a dialog/drawer
 * (or a whole widget that renders one), even portaled elsewhere. Radix's
 * DropdownMenuContent stays mounted through its own close animation, then
 * unmounts its entire subtree — portalled descendants included, since a
 * portal only changes *where in the DOM* something renders, not its place
 * in the React tree — so a dialog opened by an item's own onSelect gets
 * torn down the instant that same close finishes, which reads as "the
 * dialog opened and instantly closed itself" (this took three attempts at
 * timing/focus workarounds to actually track down — see
 * https://github.com/radix-ui/primitives/discussions/1830 and
 * https://github.com/radix-ui/primitives/discussions/1436).
 *
 * The fix used throughout this directory: for any action that opens a
 * dialog/drawer, keep that entire widget (trigger button + dialog) mounted
 * as an ordinary sibling *outside* this menu — pass it `hideTrigger` plus a
 * `triggerRef`, rendered here only as `<DropdownMenuItem onSelect={() =>
 * triggerRef.current?.click()}>` proxying a click to it. The widget then
 * lives entirely outside DropdownMenuContent's subtree and is unaffected
 * by the menu closing. Resend/Cancel invite have no dialog to protect and
 * so don't need this — they render as real DropdownMenuItems directly.
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
