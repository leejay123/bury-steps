"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { signOutLandsOn } from "@/components/forget-on-sign-out";

/** Shown when the browser is signed in as someone other than the invited
 * member — accepting must not silently apply to whoever happens to be
 * signed in, only to the person the invite named. Signing out sends them
 * to sign back in, landing on this same invite page afterwards so they
 * can complete it as the right account. */
export function WrongAccountNotice({ signInHref }: { signInHref: string }) {
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <Button
      disabled={signingOut}
      onClick={() => {
        setSigningOut(true);
        // This sign-out leads to the sign-in page, not the homepage (forget-on-sign-out.tsx).
        signOutLandsOn(signInHref);
        void signOut({ redirectUrl: signInHref });
      }}
      variant="outline"
    >
      {signingOut ? "Signing out…" : "Sign out and try again"}
    </Button>
  );
}
