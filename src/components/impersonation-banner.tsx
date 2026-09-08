"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SIGN_IN_URL } from "@/lib/urls";

/**
 * Shown for the whole session an admin is signed in as a member via
 * startImpersonation — there is no way to be in that state without this
 * banner rendering, since both read the same Clerk `act` claim
 * (getImpersonationInfo in src/lib/auth.ts). "End" ends the current
 * (impersonated) session outright and sends the admin back to sign-in as
 * themselves — Clerk's actor-token sessions don't carry a "previous
 * session" to snap back to, so a fresh sign-in is the honest option rather
 * than faking a seamless return.
 */
export function ImpersonationBanner({ adminName, targetName }: { adminName: string; targetName: string }) {
  const { signOut } = useClerk();
  const [ending, setEnding] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950">
      <span className="flex items-center gap-1.5">
        <UserCog aria-hidden="true" className="size-4 shrink-0" />
        {adminName} is viewing as {targetName}
      </span>
      <Button
        className="h-7 border-amber-950/30 bg-transparent px-2 text-amber-950 hover:bg-amber-950/10"
        disabled={ending}
        onClick={() => {
          setEnding(true);
          void signOut({ redirectUrl: SIGN_IN_URL });
        }}
        size="xs"
        variant="outline"
      >
        {ending ? "Ending…" : "End & sign back in"}
      </Button>
    </div>
  );
}
