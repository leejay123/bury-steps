"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Whether the visitor is signed in, as a promise the root layout starts
 * once and hands down without waiting for it. Lets parts of a page that
 * are otherwise the same for everyone (the homepage hero) show the right
 * buttons without asking for the session themselves — so the page itself
 * can be ready-made in advance (Next.js Cache Components) and still correct
 * for each visitor.
 */
const SignedInContext = createContext<Promise<boolean> | null>(null);

export function SignedInProvider({ children, signedIn }: { children: ReactNode; signedIn: Promise<boolean> }) {
  return <SignedInContext value={signedIn}>{children}</SignedInContext>;
}

/** The signed-in promise itself, for a client component that only needs to
 * act once it knows (null outside the provider). */
export function useSignedInPromise(): Promise<boolean> | null {
  return useContext(SignedInContext);
}

/**
 * Both sets of buttons are in the first paint. Last visit decides which
 * one is visible (the header script sets data-remembered-in before the
 * hero is drawn). If this visit disagrees, the attribute updates and the
 * other set shows. Nothing sits invisible while the session is checked.
 */
export function AuthSwitch({ signedIn, signedOut }: { signedIn: ReactNode; signedOut: ReactNode }) {
  return (
    <>
      <div className="contents" data-guest-home="">
        {signedOut}
      </div>
      <div className="contents" data-member-home="">
        {signedIn}
      </div>
    </>
  );
}
