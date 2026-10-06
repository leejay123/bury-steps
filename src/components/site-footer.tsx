import { cacheLife } from "next/cache";
import Link from "next/link";
import { Facebook } from "lucide-react";
import { FooterWordmark } from "@/components/footer-wordmark";
import { FullWidthDivider } from "@/components/full-width-divider";
import { NewsletterFooterGate } from "@/components/newsletter-footer-gate";
import { SiteLogo } from "@/components/site-logo";
import { shouldPrefetchNavLink } from "@/components/site-nav-items";
import { getOptionalUser } from "@/lib/auth";
import { PAGE_X } from "@/lib/page-x";
import { getProgressEnabled } from "@/lib/progress-settings";
import { getSiteTheme } from "@/lib/site-theme";

const linkClassName = "text-sm text-muted-foreground transition-colors hover:text-foreground";

export async function SiteFooter() {
  const [theme, progressEnabled, user] = await Promise.all([
    getSiteTheme(),
    getProgressEnabled(),
    getOptionalUser(),
  ]);
  const facebookUrl = theme.facebookGroupUrl.trim();

  return (
    <footer className="relative z-10 shrink-0 bg-background" data-site-footer="">
      <FullWidthDivider position="top" />
      {user ? <NewsletterFooterGate /> : null}
      <div className={`flex flex-col gap-6 py-8 ${PAGE_X}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SiteLogo alt={theme.siteName} src={theme.logoSrc} />
          {facebookUrl ? (
            <a
              aria-label="Facebook group"
              className="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:text-foreground"
              href={facebookUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Facebook aria-hidden className="size-4" />
            </a>
          ) : null}
        </div>
        {/*
          Mobile: a horizontally-scrolling row (same pattern as the site's
          own mobile nav bar and the admin walk-page button row) rather than
          wrapping onto several lines. Desktop has room to just wrap.
        */}
        <nav
          aria-label="Footer"
          // [transform:translateZ(0)]: same fix, same reason, as the sticky
          // header in layout.tsx — a horizontally-scrolling strip like this
          // one can briefly fail to repaint on Safari while the whole page
          // is flying past it during a fast vertical scroll, blanking out
          // for a frame or two before catching up once the scroll settles.
          // Promoting it to its own compositor layer avoids that repaint
          // race instead of leaning on the main-thread paint to keep up.
          className="-mx-4 flex flex-nowrap gap-x-6 gap-y-2 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [-ms-overflow-style:none] [transform:translateZ(0)] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden [&>*]:shrink-0"
        >
          <Link className={linkClassName} href="/">
            Home
          </Link>
          {/* Members-only pages: a visitor would just be sent to sign in. */}
          {user ? (
            <Link className={linkClassName} href="/notices" prefetch={shouldPrefetchNavLink("/notices") ? undefined : false}>
              Notices
            </Link>
          ) : null}
          {user && progressEnabled ? (
            <Link className={linkClassName} href="/progress" prefetch={shouldPrefetchNavLink("/progress") ? undefined : false}>
              Progress
            </Link>
          ) : null}
          <Link className={linkClassName} href="/contact">
            Contact us
          </Link>
          <Link className={linkClassName} href="/apps">
            Walking apps
          </Link>
          <Link className={linkClassName} href="/privacy-policy">
            Privacy Policy
          </Link>
          <Link className={linkClassName} href="/terms-of-service">
            Terms of Service
          </Link>
        </nav>
      </div>
      <div className="border-t">
        <p
          className={`${PAGE_X} py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground`}
        >
          © {await copyrightYear()} {theme.siteName}
        </p>
      </div>
      {theme.footerWordmarkEnabled ? <FooterWordmark showOnPhones={theme.footerWordmarkMobile} /> : null}
    </footer>
  );
}

/** The year for the © line — worked out ahead of time and refreshed daily,
 * so it can be part of the ready-made page (Cache Components). */
async function copyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
