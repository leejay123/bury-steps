"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { forgetSignedIn } from "@/components/shadcnio/sidebar-state";

/**
 * The moment Clerk signs someone out (the account menu's Sign out), forget them in this
 * browser before the homepage loads, so it never paints the signed-in version first.
 */
export function ForgetOnSignOut() {
  const clerk = useClerk();
  useEffect(() => {
    let signedIn = Boolean(clerk.user);
    return clerk.addListener(({ user }) => {
      if (signedIn && !user) forgetSignedIn();
      signedIn = Boolean(user);
    });
  }, [clerk]);
  return null;
}
