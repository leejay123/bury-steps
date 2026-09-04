import Link from "next/link";
import { Facebook } from "lucide-react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { NewsletterFooterGate } from "@/components/newsletter-footer-gate";
import { SiteLogo } from "@/components/site-logo";
import { shouldPrefetchNavLink } from "@/components/site-nav-items";
import { PAGE_X } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";

const linkClassName = "text-sm text-muted-foreground transition-colors hover:text-foreground";

export async function SiteFooter() {
  const theme = await getSiteTheme();
  const facebookUrl = theme.facebookGroupUrl.trim();

  return (
    <footer className="relative z-10 shrink-0 bg-background">
      <FullWidthDivider position="top" />
      <NewsletterFooterGate />
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
          className="-mx-4 flex flex-nowrap gap-x-6 gap-y-2 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [-ms-overflow-style:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden [&>*]:shrink-0"
        >
          <Link className={linkClassName} href="/">
            Home
          </Link>
          <Link className={linkClassName} href="/notices" prefetch={shouldPrefetchNavLink("/notices")}>
            Notices
          </Link>
          <Link className={linkClassName} href="/progress" prefetch={shouldPrefetchNavLink("/progress")}>
            Progress
          </Link>
          <Link className={linkClassName} href="/contact">
            Contact Us
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
          © {new Date().getFullYear()} {theme.siteName}
        </p>
      </div>
    </footer>
  );
}
