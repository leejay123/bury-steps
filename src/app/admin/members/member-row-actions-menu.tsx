"use client";

import { useState } from "react";
import type React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Collapses a member row's less-common actions (Edit permissions, Make
 * owner, Cancel invite, Remove, …) behind a single "⋯" button, so a row
 * with several owner-only actions available doesn't turn into a wall of
 * buttons. The one action someone is most likely to want next (Make
 * organiser/member, Resend invite) stays a direct button next to this.
 *
 * Each child here is a full standalone widget (a Button that opens its own
 * AlertDialog/Drawer), not a simple "pick one and close" menu item — so
 * this deliberately doesn't use Radix's Item primitive (whose built-in
 * "select this to close the menu" behaviour assumes an immediate action,
 * not opening another dialog on top). Instead the menu is closed by hand
 * the moment any click bubbles up from inside it; the child's own onClick
 * (opening its dialog) still runs first, so both happen in the same tick.
 */
export function MemberRowActionsMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button aria-label="More actions" size="xs" variant="outline">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="flex flex-col gap-1 p-1.5"
        onClick={() => setOpen(false)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
