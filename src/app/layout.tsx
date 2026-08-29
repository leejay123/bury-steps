import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import { AFTER_AUTH_PATH, appUrl, SIGN_IN_URL, SIGN_UP_URL } from "@/lib/urls";
import { PAGE_X, PAGE_Y } from "@/lib/page-x";
import { SiteMobileNav, SiteNav, SiteNavFallback } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { FullWidthDivider } from "@/components/full-width-divider";
import { MotionPage } from "@/components/motion";
import { BackToTopGate } from "@/components/back-to-top-gate";
import { UnlockPageOnNavigate, UnlockingLink } from "@/components/overlay-root";
import { SiteCookieConsent } from "@/components/site-cookie-consent";
import "./globals.css";

const SITE_NAME = "Bury Steps Walking Group";
const SITE_DESCRIPTION = "Weekly walks around Bury. Sign up, join a walk, clock in.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export const preferredRegion = ["lhr1"];

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: "#111111",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    // Chrome/Android: resize the layout with the keyboard instead of
    // overlaying it (that overlay is what feels like a zoom/jump).
    // iOS ignores this; 16px fields + visual-viewport CSS handle Safari.
    interactiveWidget: "resizes-content",
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Preview only. The live domain uses Clerk's CNAME. Production unique
  // *.vercel.app URLs (Vercel screenshots) must not set this — there is no
  // proxy URL registered on the Clerk instance, so /__clerk returns 400.
  const useVercelAppProxy = process.env.VERCEL_ENV === "preview";

  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body className="min-h-dvh overflow-x-clip touch-manipulation bg-background text-foreground antialiased">
        <ClerkProvider
          {...(useVercelAppProxy ? { proxyUrl: "/__clerk" } : {})}
          appearance={{
            theme: shadcn,
            variables: {
              colorPrimary: "#111111",
              colorModalBackdrop: "rgba(17, 17, 17, 0.4)",
              colorInput: "var(--background)",
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
        >
          {/*
            iPhones with a Dynamic Island report it as a safe-area inset on
            whichever side it lands on after a landscape rotation (left or
            right depending on rotation direction), not just the top. This is
            0px on every other device/orientation, so it only ever adds space
            here when there is actually a notch/island to clear. Applied on
            the outermost shell (rather than on individual pages) so it also
            covers content that intentionally bleeds edge-to-edge.
          */}
          <div
            className="mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col border-x pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
            data-site-shell
          >
            <UnlockPageOnNavigate />
            {/*
              Off-screen until focused, so a keyboard/screen-reader user's
              very first tab stop jumps straight past the header and nav —
              repeated on every page — instead of having to tab through it
              every single time to reach the actual content.
            */}
            <a
              className="sr-only rounded-md bg-background px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring"
              href="#main-content"
            >
              Skip to content
            </a>
            {/*
              Solid sticky header — no backdrop-filter. Blurring content that
              scrolls under a sticky bar is expensive on Safari and caused
              visible lag on MacBooks; an opaque bar stays crisp and cheap.
              [transform:translateZ(0)] keeps it on its own compositor layer.
              Overlays measure this bar into --site-header-height and pin it
              while open so it stays visible above drawers/dialogs.
            */}
            <header className="sticky top-0 z-[65] touch-manipulation bg-background [transform:translateZ(0)]">
              <div className="relative">
                <div className={`flex h-14 items-center justify-between gap-3 ${PAGE_X} md:grid md:grid-cols-[1fr_auto_1fr]`}>
                  <UnlockingLink className="flex h-8 min-w-0 items-center justify-self-start" href="/">
                    <SiteLogo />
                  </UnlockingLink>
                  <Suspense fallback={<SiteNavFallback />}>
                    <SiteNav />
                  </Suspense>
                </div>
                <Suspense fallback={null}>
                  <SiteMobileNav />
                </Suspense>
                <FullWidthDivider position="bottom" />
              </div>
            </header>
            <main className={`flex-1 ${PAGE_Y} ${PAGE_X}`} id="main-content">
              <MotionPage>{children}</MotionPage>
            </main>
            <SiteFooter />
          </div>
          <Toaster duration={2800} position="top-center" />
          <SiteCookieConsent />
          <Suspense fallback={null}>
            <BackToTopGate />
          </Suspense>
        </ClerkProvider>
        {/*
          Vercel Analytics is cookieless — it counts page views with a
          request-time hash, not a client-side identifier — so it needs no
          entry in the cookie notice and works the same whether someone
          accepts or declines it. See the "Cookies" section of the privacy
          policy for the full explanation.
        */}
        <Analytics />
      </body>
    </html>
  );
}
