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
 * of that, same as clicking it standalone would.
 */
export function MemberRowActionsMenu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="More actions" size="xs" variant="outline">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
