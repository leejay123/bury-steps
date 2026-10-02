"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Whether the visitor is signed in, worked out once by the root layout and
 * handed down. Lets parts of a page that are otherwise the same for
 * everyone (the homepage hero) show the right buttons without asking for
 * the session themselves — so the page itself can be ready-made in
 * advance (Next.js Cache Components) and still correct for each visitor.
 */
const SignedInContext = createContext(false);

export function SignedInProvider({ children, signedIn }: { children: ReactNode; signedIn: boolean }) {
  return <SignedInContext value={signedIn}>{children}</SignedInContext>;
}

export function useSignedIn() {
  return useContext(SignedInContext);
}

/** Shows `signedIn` to signed-in visitors and `signedOut` to everyone else. */
export function AuthSwitch({ signedIn, signedOut }: { signedIn: ReactNode; signedOut: ReactNode }) {
  return <>{useSignedIn() ? signedIn : signedOut}</>;
}
