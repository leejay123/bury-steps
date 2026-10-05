"use client";

import { createContext, Suspense, use, useContext, type ReactNode } from "react";

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
 * Shows `signedIn` to signed-in visitors and `signedOut` to everyone else.
 *
 * The ready-made page is shared by everyone, so it can't know which to
 * show: it holds the signed-out version's space, invisible and not
 * clickable, and the right one replaces it once this visitor's session is
 * checked. Nobody ever sees the wrong buttons, and the hero doesn't jump.
 */
export function AuthSwitch({ signedIn, signedOut }: { signedIn: ReactNode; signedOut: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div aria-hidden className="invisible contents" inert>
          {signedOut}
        </div>
      }
    >
      <ResolvedAuthSwitch signedIn={signedIn} signedOut={signedOut} />
    </Suspense>
  );
}

function ResolvedAuthSwitch({ signedIn, signedOut }: { signedIn: ReactNode; signedOut: ReactNode }) {
  const promise = useContext(SignedInContext);
  return <>{promise && use(promise) ? signedIn : signedOut}</>;
}
