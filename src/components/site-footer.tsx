import Link from "next/link";
import { Facebook } from "lucide-react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { PAGE_X } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";

export async function SiteFooter() {
  const theme = await getSiteTheme();
  const facebookUrl = theme.facebookGroupUrl.trim();

  return (
    <footer className="relative z-10 shrink-0 bg-background">
      <FullWidthDivider position="top" />
      <div className={PAGE_X}>
        <NewsletterSignup />
        <div aria-hidden className="h-px bg-border" />
      </div>
      <nav
        aria-label="Footer"
        className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 ${PAGE_X} py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-muted-foreground md:justify-between`}
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
    </footer>
  );
}
