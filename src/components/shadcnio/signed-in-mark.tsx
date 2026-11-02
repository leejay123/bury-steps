"use client";

import { useEffect } from "react";
import { ME_COOKIE, SIGNED_IN_COOKIE, forgetSignedIn, syncGuestDash, type SidebarMe } from "./sidebar-state";

/** What the pre-paint script does (sidebar-state.ts, APPLY_ME), for the first visit and for changes. */
function applyMe(me: SidebarMe) {
  const root = document.documentElement;
  root.setAttribute("data-sb-role", me.role);
  root.style.setProperty("--me-name", JSON.stringify(me.name || ""));
  root.style.setProperty("--me-email", JSON.stringify(me.email || ""));
  if (me.image) root.style.setProperty("--me-img", `url(${JSON.stringify(me.image)})`);
  else root.style.removeProperty("--me-img");
}

/**
 * Keeps the "signed in" mark in step with the session: set for a member, so
 * the next page paints with the sidebar from the start; cleared for someone
 * signed out, who never sees it. With `me`, also remembers who it is (role,
 * name, email, photo) so the sidebar is right before the first paint next time.
 */
export function SignedInMark({ signedIn, me }: { signedIn: boolean; me?: SidebarMe }) {
  const meJson = me ? JSON.stringify(me) : "";
  useEffect(() => {
    const root = document.documentElement;
    if (signedIn) {
      document.cookie = `${SIGNED_IN_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax`;
      root.setAttribute("data-remembered-in", "");
      if (meJson) {
        document.cookie = `${ME_COOKIE}=${encodeURIComponent(meJson)}; Path=/; Max-Age=31536000; SameSite=Lax`;
        applyMe(JSON.parse(meJson) as SidebarMe);
      }
      syncGuestDash(window.location.pathname);
    } else {
      // Every remembered piece, not just the mark (forgetSignedIn), or the next visit
      // paints the signed-in page first.
      forgetSignedIn();
    }
  }, [signedIn, meJson]);
  return null;
}
