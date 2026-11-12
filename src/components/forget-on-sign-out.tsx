"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { forgetSignedIn } from "@/components/shadcnio/sidebar-state";
import { hasSessionCookie, onceSignedOut } from "@/lib/sign-out-load";

/** Where the fresh page load after a sign-out goes: the homepage, as Clerk's afterSignOutUrl. */
let landOn = "/";
/** The fresh load is under way — one per sign-out, however many Clerk islands are listening. */
let leaving = false;
/** Set while waiting for Clerk's sign-in cookie to go. */
let stopWaiting: (() => void) | null = null;

/** For a sign-out that is headed somewhere other than the homepage (the invite page's). */
export function signOutLandsOn(href: string) {
  landOn = href;
}

/**
 * Finishes a sign-out with a real page load (see sign-out-load.ts): without it the header kept
 * showing Dashboard until the page was refreshed by hand. `pressedHere`: Sign out was pressed in
 * this tab, so go where sign-out leads; otherwise (signed out in another tab, or the session
 * ended) reload the page this tab is on.
 */
function loadFresh(pressedHere: boolean) {
  if (leaving) return;
  leaving = true;
  stopWaiting?.();
  if (pressedHere) window.location.replace(landOn);
  else window.location.reload();
}

/**
 * The moment Clerk signs someone out (the account menu's Sign out), forget them in this
 * browser before the homepage loads, so it never paints the signed-in version first — then
 * load that page afresh once the session has really ended.
 */
export function ForgetOnSignOut() {
  const clerk = useClerk();
  useEffect(() => {
    let signedIn = Boolean(clerk.user);
    let pressedHere = false;
    return clerk.addListener(({ user }) => {
      if (user) {
        signedIn = true;
        pressedHere = false;
        return;
      }
      if (!signedIn) return;
      forgetSignedIn();
      if (user === null) {
        // Signed out for certain.
        signedIn = false;
        loadFresh(pressedHere);
        return;
      }
      // `undefined`: Sign out has just been pressed in this tab and Clerk is still ending the
      // session. Leaving now could cut that off, so wait for its sign-in cookie to go.
      pressedHere = true;
      if (leaving || stopWaiting || !hasSessionCookie(document.cookie)) return;
      stopWaiting = onceSignedOut({
        cookie: () => document.cookie,
        done: () => loadFresh(true),
        gaveUp: () => {
          stopWaiting = null;
        },
      });
    });
  }, [clerk]);
  return null;
}
