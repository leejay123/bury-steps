import { SerwistProvider } from "@serwist/turbopack/react";
import { TopLoader } from "@/components/shadcnio/top-loader";
import { SIDEBAR_SCRIPT } from "@/components/shadcnio/sidebar-state";
import { COLOR_MODE_SCRIPT } from "@/lib/color-mode-script";
import { CUSTOMIZE_SCRIPT } from "@/lib/shadcnio-customize";
import type { CSSProperties } from "react";
import { ClientPathnameProvider } from "@/components/client-pathname";
import { SiteMotionConfig } from "@/components/site-motion-config";
import { LiveUpdates } from "@/components/live-updates";
import { KeepFormInputOnError } from "@/components/keep-form-input-on-error";
import { WalkEssentialsProvider } from "@/components/walk-essentials-context";
import { WalkWordingProvider } from "@/components/walk-wording-context";
import { SignedInProvider } from "@/components/signed-in-context";
import { textSizeCssVars } from "@/lib/text-sizes";
import { ButtonRipple } from "@/components/button-ripple";
import { HeaderScrollShadow } from "@/components/header-scroll-shadow";
import { FocusRescue } from "@/components/focus-rescue";
import { PlaceholderPreviewBadge } from "@/components/placeholder-preview-badge";
import { TabStyleProvider } from "@/components/ui/tabs";
import { HeaderPartBoundary } from "@/components/header-part-boundary";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { auth } from "@clerk/nextjs/server";
import { isClerkMiddlewareMissingError } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { appUrl } from "@/lib/urls";
import { UnlockPageOnNavigate } from "@/components/overlay-root";
import { SiteCookieConsentGate } from "@/components/site-cookie-consent-gate";
import { StaleDeployReload } from "@/components/stale-deploy-reload";
import { getSiteTheme } from "@/lib/site-theme";
import { siteFontVariableClassName, typesetFontVariables } from "@/app/fonts";
import { siteMetaDescription } from "@/lib/site-branding";
import { ScrollRowArrows } from "@/components/scroll-row-arrows";
import "./globals.css";
import "@/components/shadcnio/shadcnio.css";

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
    appleWebApp: {
      capable: true,
      title: theme.siteName,
      statusBarStyle: "default",
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: "#111111",
    width: "device-width",
    initialScale: 1,
    // Pinch-to-zoom stays allowed (accessibility: plenty of members want
    // bigger text). Form fields are 16px+, so iOS doesn't zoom on focus.
    viewportFit: "cover",
    // Chrome/Android: resize the layout with the keyboard instead of
    // overlaying it (that overlay is what feels like a zoom/jump).
    // iOS ignores this; 16px fields + visual-viewport CSS handle Safari.
    interactiveWidget: "resizes-content",
  };
}

/** Signed in or not, from the server — no browser code needed. */
async function isSignedIn() {
  try {
    return Boolean((await auth()).userId);
  } catch (error) {
    // Pages outside the middleware (a missing static file's 404) have no
    // auth context — treat them as signed out. Anything else must be
    // rethrown: with Cache Components, reading the session throws on
    // purpose while the shared shell is built, and swallowing that built
    // the shell as signed-out for everyone.
    if (isClerkMiddlewareMissingError(error)) return false;
    throw error;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSiteTheme();
  // Not awaited: the page is drawn without waiting for the session, so the
  // same ready-made page can serve everyone. Only the parts that differ
  // wait for this, each in its own placeholder.
  const signedIn = isSignedIn();

  return (
    <html
      className={`${siteFontVariableClassName} ${typesetFontVariables}`}
      // Settings → Site behaviour → Phone menu, known before anything streams
      // in, so phone layout rules for the bottom bar (logo on the left, room
      // at the bottom) apply from the first paint — see globals.css.
      data-phone-menu={theme.mobileNav}
      data-design="shadcnio"
      // Settings → Branding → Page tops (globals.css: [data-page-top]).
      data-page-top={theme.pageTopStyle}
      lang="en-GB"
      style={
        {
          "--font-site": "var(--font-hanken)",
          ...textSizeCssVars(theme.textSizes),
        } as CSSProperties
      }
      suppressHydrationWarning
    >
      <head>
        {/* Run as the page arrives, before anything is drawn, so a refresh shows the right
            look straight away: light/dark mode, the shadcn.io Customize choices, signed in
            (the sidebar and the signed-in menu) with the sidebar's folded state, and
            scroll restoration off. Plain scripts: next/script's
            beforeInteractive only queues them for Next's own code, which runs after the
            first paint, so the signed-out menu used to show first. */}
        <script dangerouslySetInnerHTML={{ __html: COLOR_MODE_SCRIPT }} id="color-mode" />
        <script dangerouslySetInnerHTML={{ __html: CUSTOMIZE_SCRIPT }} id="shadcnio-customize" />
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_SCRIPT }} id="docs-sidebar" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch {}`,
          }}
          id="scroll-restoration"
        />
        {/* Don't draw anything until the ready-made page has been read down to
            the phone bar's slot (the end of the layout). The page streams in,
            and the browser drew whatever had arrived: the header first, then
            the hero, then the rest, with the logo a beat behind. Now the first
            paint is the whole page. Chrome/Edge; other browsers ignore it. The
            frame has no phone bar, so it waits for its own end instead
            (waiting for a slot that never comes held the page back until it had
            all arrived). */}
        <link blocking="render" href="#bs-frame-end" rel="expect" />
      </head>
      {/* font-sans: the site font (--font-site: Hanken Grotesk, or the
          Customize panel's Style), not a fixed face — a fixed one here
          stopped Style changing the text anywhere. */}
      <body
        className={`font-sans min-h-dvh overflow-x-clip touch-manipulation bg-background text-foreground antialiased`}
      >
        <SerwistProvider reloadOnOnline={false} swUrl="/serwist/sw.js">
        {/*
          The browser's own scroll-restoration-on-refresh fights this app's
          progressively-loading content (images, carousels, the FAQ
          accordion): it tries to restore the old scroll position before
          that content has re-rendered and pushed the page back to its full
          height, so a refresh partway down the homepage lands stuck near
          the top of the hero instead of where you actually were. Opting out
          makes every refresh start at the top instead — predictable, if
          less clever than a correct restore would be.
        */}
        <StaleDeployReload />
        <ClientPathnameProvider>
        <SiteMotionConfig>
          {/*
            iPhones with a Dynamic Island report it as a safe-area inset on
            whichever side it lands on after a landscape rotation (left or
            right depending on rotation direction), not just the top. This is
            0px on every other device/orientation, so it only ever adds space
            here when there is actually a notch/island to clear. Applied on
            the outermost shell (rather than on individual pages) so it also
            covers content that intentionally bleeds edge-to-edge.
          */}
          <TopLoader>
            <UnlockPageOnNavigate />
            <LiveUpdates />
            <ScrollRowArrows />
            <KeepFormInputOnError />
            <WalkEssentialsProvider items={theme.walkEssentials}>
              <WalkWordingProvider wording={theme.walkWording}>
                <TabStyleProvider style={theme.tabStyle}>
                  <SignedInProvider signedIn={signedIn}>{children}</SignedInProvider>
                </TabStyleProvider>
              </WalkWordingProvider>
            </WalkEssentialsProvider>
            {/* First paint waits for this (rel="expect" above). */}
            <div hidden id="bs-frame-end" />
          </TopLoader>
          <Toaster
            duration={2800}
            // Above the phone bottom bar when it's there (globals.css sets the var).
            mobileOffset={{ bottom: "calc(16px + var(--bottom-nav-offset, 0px))" }}
            position="bottom-left"
          />
          <ButtonRipple />
          <HeaderScrollShadow />
          <FocusRescue />
          <PlaceholderPreviewBadge />
          <HeaderPartBoundary name="cookie-notice">
            <Suspense fallback={null}>
              <SiteCookieConsentGate />
            </Suspense>
          </HeaderPartBoundary>
        </SiteMotionConfig>
        </ClientPathnameProvider>
        {/*
          Vercel Analytics and Speed Insights are cookieless — page views and
          performance samples use a request-time hash, not a client-side
          identifier — so they need no entry in the cookie notice and work the
          same whether someone accepts or declines it. See the "Cookies"
          section of the privacy policy for the full explanation.
        */}
        <Analytics />
        <SpeedInsights />
        </SerwistProvider>
      </body>
    </html>
  );
}
