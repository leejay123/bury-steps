import type { CSSProperties } from "react";
import { PageFade } from "@/components/page-fade";
import { ClientPathnameProvider } from "@/components/client-pathname";
import { SiteMotionConfig } from "@/components/site-motion-config";
import { LiveUpdates } from "@/components/live-updates";
import { SkeletonHoldScript } from "@/components/skeleton-hold-script";
import { ContentReveal } from "@/components/content-reveal";
import { KeepFormInputOnError } from "@/components/keep-form-input-on-error";
import { WalkEssentialsProvider } from "@/components/walk-essentials-context";
import { SignedInProvider } from "@/components/signed-in-context";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { textSizeCssVars } from "@/lib/text-sizes";
import { FullWidthDivider } from "@/components/full-width-divider";
import { ButtonRipple } from "@/components/button-ripple";
import { HeaderScrollShadow } from "@/components/header-scroll-shadow";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { auth } from "@clerk/nextjs/server";
import { isClerkMiddlewareMissingError } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { appUrl } from "@/lib/urls";
import { PAGE_X, PAGE_Y } from "@/lib/page-x";
import { SiteMobileNav, SiteNav, SiteNavFallback, SiteBottomNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteBrandLink } from "@/components/site-brand-link";
import { SiteLogo } from "@/components/site-logo";
import { BackToTopGate } from "@/components/back-to-top-gate";
import { UnlockPageOnNavigate } from "@/components/overlay-root";
import { SiteCookieConsentGate } from "@/components/site-cookie-consent-gate";
import { StaleDeployReload } from "@/components/stale-deploy-reload";
import { ImpersonationBannerSlot } from "@/components/impersonation-banner-slot";
import { getSiteTheme } from "@/lib/site-theme";
import { siteFontById } from "@/lib/site-font";
import { siteFontFace, siteFontVariableClassName, typesetFontVariables } from "@/app/fonts";
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
  // (the hero's buttons) wait for this, each in its own placeholder.
  const signedIn = isSignedIn();
  const font = siteFontById(theme.siteFont);
  const face = siteFontFace(theme.siteFont);

  return (
    <html
      className={`${siteFontVariableClassName} ${typesetFontVariables}`}
      lang="en-GB"
      style={{ "--font-site": `var(${font.cssVariable})`, ...textSizeCssVars(theme.textSizes) } as CSSProperties}
      suppressHydrationWarning
    >
      <body
        className={`${face.className} min-h-dvh overflow-x-clip touch-manipulation bg-background text-foreground antialiased`}
      >
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
        <SkeletonHoldScript />
        <Script id="scroll-restoration" strategy="beforeInteractive">
          {`try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch {}`}
        </Script>
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
          <div className="mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col border-x pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
            <UnlockPageOnNavigate />
            <LiveUpdates />
            <ContentReveal />
            <KeepFormInputOnError />
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

              z-[66] keeps the header above any sticky or raised page content
              scrolling underneath it.
            */}
            <header
              className="group/site-header sticky top-0 z-[66] touch-manipulation bg-background transition-shadow duration-200 [transform:translateZ(0)] data-scrolled:shadow-[0_4px_12px_-6px_rgb(0_0_0/0.12)]"
              data-site-header=""
            >
              {theme.announcementEnabled && theme.announcementText ? (
                <AnnouncementBanner
                  link={theme.announcementLink}
                  pages={theme.announcementPages}
                  text={theme.announcementText}
                />
              ) : null}
              <Suspense fallback={null}>
                <ImpersonationBannerSlot />
              </Suspense>
              <div className="relative">
                {/*
                  auto on the outer (logo, bell/avatar) columns, not 1fr —
                  those should never be asked to shrink; only the middle
                  nav-links column should give up space, since it already
                  has its own overflow-x-auto scroller to fall back on
                  (SiteNavLinks). A plain `auto` track's automatic minimum
                  is otherwise its content's own max-content size, so this
                  middle column still needs minmax(0,1fr) — the 0 floor
                  lets it shrink past that and actually scroll instead of
                  forcing the logo/avatar columns to shrink (or the nav to
                  spill over them) once the window is too narrow for
                  everything to fit at its natural size. 1fr instead of
                  auto for its own max: this column should claim all
                  left-over space once there's room to (so its own
                  justify-center still centers the links), not stop
                  growing at exactly the links' own content width the way
                  the previous auto-based track did.
                */}
                {/*
                  Phones: equal 1fr side columns put the logo in the true
                  middle of the screen. A 1fr track never shrinks below its
                  content, so when Sign in + Join the group are wider than
                  half the space the logo moves left rather than overlapping.
                */}
                <div className={`group/header-row grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 ${PAGE_X} md:grid-cols-[auto_minmax(0,1fr)_auto]`}>
                  <Suspense fallback={null}>
                    <SiteMobileNav />
                  </Suspense>
                  <div className="contents max-md:col-start-2 max-md:flex max-md:justify-center" data-site-logo-cell="">
                    <Suspense
                      fallback={
                        <div className="flex h-8 min-w-0 items-center justify-self-start">
                          <SiteLogo alt={DEFAULT_SITE_NAME} />
                        </div>
                      }
                    >
                      <SiteBrandLink />
                    </Suspense>
                  </div>
                  <Suspense fallback={<SiteNavFallback />}>
                    <SiteNav />
                  </Suspense>
                </div>
                {/* Line at the top of the page; the stuck header's shadow takes over once scrolled. */}
                <FullWidthDivider
                  className="transition-opacity duration-200 group-data-scrolled/site-header:opacity-0"
                  position="bottom"
                />
              </div>
            </header>
            {/*
              Standard flexbox "sticky footer": the outer shell above is
              `min-h-dvh flex flex-col`, and this flex-1 is what makes <main>
              claim all the leftover height so the footer always sits at the
              very bottom of the viewport on a short page (e.g. Messages with
              one row), instead of leaving blank space below the footer.

              The trade-off is unavoidable, not a bug: on a short page the
              empty space has to live somewhere, and this puts it between the
              page's own content and the footer (inside <main>) rather than
              below the footer. A page long enough to fill the viewport on
              its own looks identical either way.
            */}
            <main className={`flex flex-1 flex-col ${PAGE_Y} ${PAGE_X}`} id="main-content">
              {/* Page content fades in quickly on navigation (page-fade.tsx);
                  the header is outside, so it stays put. */}
              <PageFade mode={theme.pageTransition}>
                <WalkEssentialsProvider items={theme.walkEssentials}>
                  <SignedInProvider signedIn={signedIn}>{children}</SignedInProvider>
                </WalkEssentialsProvider>
              </PageFade>
            </main>
            <Suspense fallback={null}>
              <SiteFooter />
            </Suspense>
            <Suspense fallback={null}>
              <SiteBottomNav />
            </Suspense>
          </div>
          <Toaster
            duration={2800}
            // Above the phone bottom bar when it's there (globals.css sets the var).
            mobileOffset={{ bottom: "calc(16px + var(--bottom-nav-offset, 0px))" }}
            position="bottom-left"
          />
          <ButtonRipple />
          <HeaderScrollShadow />
          <Suspense fallback={null}>
            <SiteCookieConsentGate />
          </Suspense>
          <Suspense fallback={null}>
            <BackToTopGate />
          </Suspense>
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
      </body>
    </html>
  );
}
