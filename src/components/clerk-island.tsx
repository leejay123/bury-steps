import type { ReactNode } from "react";
import { shadcn } from "@clerk/themes";
import { LazyClerkProvider } from "@/components/clerk-lazy";
import { AFTER_AUTH_PATH, SIGN_IN_URL, SIGN_UP_URL } from "@/lib/urls";

/**
 * Clerk's browser code around just one signed-in-only part of a page (the
 * avatar menu, the impersonation banner, the invite page's sign-out).
 *
 * It used to wrap the whole site, which meant the root layout had to check
 * the session before drawing anything — so no page could be ready-made in
 * advance (Next.js Cache Components). These parts are only ever rendered
 * after the server has confirmed someone is signed in, so signed-out
 * visitors still never download Clerk. When two are on one page they share
 * a single Clerk instance in the browser.
 */
export function ClerkIsland({ children }: { children: ReactNode }) {
  // Preview only. The live domain uses Clerk's CNAME. Production unique
  // *.vercel.app URLs (Vercel screenshots) must not set this — there is no
  // proxy URL registered on the Clerk instance, so /__clerk returns 400.
  const useVercelAppProxy = process.env.VERCEL_ENV === "preview";
  return (
    <LazyClerkProvider
      {...(useVercelAppProxy ? { proxyUrl: "/__clerk" } : {})}
      // The account menu loads this when it is opened. Preloading it on every
      // page makes the browser warn that the file was fetched and never used.
      prefetchUI={false}
      appearance={{
        theme: shadcn,
        variables: {
          colorPrimary: "#111111",
          colorModalBackdrop: "rgba(17, 17, 17, 0.4)",
          colorInput: "var(--background)",
          fontFamily: "var(--font-site), sans-serif",
        },
        elements: {
          modalBackdrop: "backdrop-blur-md",
          input: "bg-background text-base outline-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0",
          formFieldInput: "bg-background text-base outline-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0",
        },
      }}
      signInUrl={SIGN_IN_URL}
      signUpUrl={SIGN_UP_URL}
      signInFallbackRedirectUrl={AFTER_AUTH_PATH}
      signUpFallbackRedirectUrl={AFTER_AUTH_PATH}
      afterSignOutUrl="/"
    >
      {children}
    </LazyClerkProvider>
  );
}
