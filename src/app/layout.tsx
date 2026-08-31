import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import { AFTER_AUTH_PATH, appUrl, SIGN_IN_URL, SIGN_UP_URL } from "@/lib/urls";
import { PAGE_X, PAGE_Y } from "@/lib/page-x";
import { SiteMobileNav, SiteNav, SiteNavFallback } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteBrandLink } from "@/components/site-brand-link";
import { SiteLogo } from "@/components/site-logo";
import { FullWidthDivider } from "@/components/full-width-divider";
import { MotionPage } from "@/components/motion";
import { BackToTopGate } from "@/components/back-to-top-gate";
import { UnlockPageOnNavigate } from "@/components/overlay-root";
import { SiteCookieConsentGate } from "@/components/site-cookie-consent-gate";
import { getSiteTheme } from "@/lib/site-theme";
import { DEFAULT_SITE_NAME, siteMetaDescription } from "@/lib/site-branding";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getSiteTheme();
  const description = siteMetaDescription(theme.siteTagline);
  return {
    metadataBase: new URL(appUrl()),
    title: {
      default: theme.siteName,
      template: `%s — ${theme.siteName}`,
    },
    description,
    openGraph: {
      title: theme.siteName,
      description,
      url: "/",
      siteName: theme.siteName,
      locale: "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: theme.siteName,
      description,
    },
  };
}

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
          <div className="mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col border-x pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
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
            */}
            <header className="sticky top-0 z-[55] touch-manipulation bg-background [transform:translateZ(0)]">
              <div className="relative">
                <div className={`flex h-14 items-center justify-between gap-3 ${PAGE_X} md:grid md:grid-cols-[1fr_auto_1fr]`}>
                  <Suspense
                    fallback={
                      <div className="flex h-8 min-w-0 items-center justify-self-start">
                        <SiteLogo alt={DEFAULT_SITE_NAME} />
                      </div>
                    }
                  >
                    <SiteBrandLink />
                  </Suspense>
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
            <Suspense fallback={null}>
              <SiteFooter />
            </Suspense>
          </div>
          <Toaster duration={2800} position="top-center" />
          <Suspense fallback={null}>
            <SiteCookieConsentGate />
          </Suspense>
          <Suspense fallback={null}>
            <BackToTopGate />
          </Suspense>
        </ClerkProvider>
        {/*
          Vercel Analytics and Speed Insights are cookieless — page views and
          performance samples use a request-time hash, not a client-side
          identifier — so they need no entry in the cookie notice and work the
          same whether someone accepts or declines it. See the "Cookies"
          section of the privacy policy for the full explanation.
        */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
