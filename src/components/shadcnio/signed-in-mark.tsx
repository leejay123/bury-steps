"use client";

import { useEffect } from "react";
import { SIGNED_IN_COOKIE } from "./sidebar-state";

/**
 * Keeps the "signed in" mark in step with the session: set for a member, so
 * the next page paints with the sidebar from the start; cleared for someone
 * signed out, who never sees it.
 */
export function SignedInMark({ signedIn }: { signedIn: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    if (signedIn) {
      document.cookie = `${SIGNED_IN_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax`;
      root.setAttribute("data-remembered-in", "");
    } else {
      document.cookie = `${SIGNED_IN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
      root.removeAttribute("data-remembered-in");
    }
  }, [signedIn]);
  return null;
}
