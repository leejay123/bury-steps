import Link from "next/link";
import { Facebook } from "lucide-react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { NewsletterFooterGate } from "@/components/newsletter-footer-gate";
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
      <nav
        aria-label="Footer quick links"
        className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 ${PAGE_X} pt-4 text-xs text-muted-foreground`}
      >
        <Link href="/" className="whitespace-nowrap hover:text-foreground">
          Home
        </Link>
        <Link href="/notices" className="whitespace-nowrap hover:text-foreground">
          Notices
        </Link>
        <Link href="/progress" className="whitespace-nowrap hover:text-foreground">
          Progress
        </Link>
      </nav>
      <nav
        aria-label="Footer legal"
        className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 ${PAGE_X} py-3 text-xs text-muted-foreground md:justify-between`}
      >
        <Link href="/privacy-policy" className="whitespace-nowrap hover:text-foreground">
          Privacy Policy
        </Link>
        <Link href="/terms-of-service" className="whitespace-nowrap hover:text-foreground">
          Terms of Service
        </Link>
        {facebookUrl ? (
          <>
            <span aria-hidden className="hidden h-px min-w-4 flex-1 sm:block" />
            <a
              className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-foreground"
              href={facebookUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Facebook aria-hidden className="size-3.5" />
              Facebook group
            </a>
          </>
        ) : null}
      </nav>
      <p
        className={`${PAGE_X} pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground`}
      >
        © {new Date().getFullYear()} {theme.siteName}
      </p>
    </footer>
  );
}
