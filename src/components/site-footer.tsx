import Link from "next/link";
import { Facebook } from "lucide-react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { NewsletterFooterGate } from "@/components/newsletter-footer-gate";
import { SiteLogo } from "@/components/site-logo";
import { getOptionalUser } from "@/lib/auth";
import { PAGE_X } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";

export async function SiteFooter() {
  const [theme, user] = await Promise.all([getSiteTheme(), getOptionalUser()]);
  const facebookUrl = theme.facebookGroupUrl.trim();
  const isAdmin = user?.role === "ADMIN";

  return (
    <footer className="relative z-10 shrink-0 bg-background">
      <FullWidthDivider position="top" />
      <NewsletterFooterGate isAdmin={isAdmin} />
      <div className={`flex flex-col gap-8 py-10 sm:flex-row sm:justify-between ${PAGE_X}`}>
        <div className="flex max-w-xs flex-col gap-3">
          <SiteLogo alt={theme.siteName} src={theme.logoSrc} />
          <p className="text-sm text-muted-foreground">{theme.siteTagline}</p>
          {facebookUrl ? (
            <div className="flex gap-2">
              <a
                aria-label="Facebook group"
                className="flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                href={facebookUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Facebook aria-hidden className="size-4" />
              </a>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-8 sm:gap-16">
          <nav aria-label="Explore" className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Explore
            </p>
            <Link className="text-sm hover:text-foreground" href="/">
              Home
            </Link>
            <Link className="text-sm hover:text-foreground" href="/notices">
              Notices
            </Link>
            <Link className="text-sm hover:text-foreground" href="/progress">
              Progress
            </Link>
          </nav>
          <nav aria-label="Legal" className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Legal
            </p>
            <Link className="text-sm hover:text-foreground" href="/privacy-policy">
              Privacy Policy
            </Link>
            <Link className="text-sm hover:text-foreground" href="/terms-of-service">
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>
      <div className="relative">
        <FullWidthDivider position="top" />
        <p
          className={`${PAGE_X} py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground`}
        >
          © {new Date().getFullYear()} {theme.siteName}
        </p>
      </div>
    </footer>
  );
}
