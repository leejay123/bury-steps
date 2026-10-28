"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOutIcon } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SIGN_IN_URL } from "@/lib/urls";
import { leaveDashboardView } from "@/components/dashboard/dashboard-view";

/** The dashboard avatar menu's Log out (inside ClerkIsland, from the layout). */
export function DashboardSignOut() {
  const { signOut } = useClerk();
  return (
    <DropdownMenuItem
      onSelect={() => {
        leaveDashboardView();
        void signOut({ redirectUrl: SIGN_IN_URL });
      }}
    >
      <LogOutIcon />
      Log out
    </DropdownMenuItem>
  );
}
