import Link from "next/link";
import { Facebook } from "lucide-react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { NewsletterFooterGate } from "@/components/newsletter-footer-gate";
import { SiteLogo } from "@/components/site-logo";
import { PAGE_X } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title} className={`flex flex-col gap-1 py-8 ${PAGE_X}`}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      {children}
    </nav>
  );
}

export async function SiteFooter() {
  const theme = await getSiteTheme();
  const facebookUrl = theme.facebookGroupUrl.trim();
  // Footer-4's tactile row treatment (bordered grid cells, a hover fill
  // behind each row) minus its social-brand banner rows — links stay plain
  // text, just the same hover affordance the block gives its rows.
  const linkClassName =
    "-mx-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50";

  return (
    <footer className="relative z-10 shrink-0 bg-background">
      <FullWidthDivider position="top" />
      <NewsletterFooterGate />
      {/* Edge-to-edge like the rest of the page's full-width dividers —
          deliberately not wrapped in PAGE_X; each cell puts PAGE_X back on
          its own content so text still lines up with the header/hero. */}
      <div className="grid grid-cols-1 divide-y border-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className={`flex flex-col gap-3 py-8 ${PAGE_X}`}>
          <SiteLogo alt={theme.siteName} src={theme.logoSrc} />
          <p className="max-w-xs text-sm text-muted-foreground">{theme.siteTagline}</p>
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

        <FooterColumn title="Explore">
          <Link className={linkClassName} href="/">
            Home
          </Link>
          <Link className={linkClassName} href="/notices">
            Notices
          </Link>
          <Link className={linkClassName} href="/progress">
            Progress
          </Link>
        </FooterColumn>
        <FooterColumn title="About">
          <Link className={linkClassName} href="/#howThisStarted">
            How this started
          </Link>
          <Link className={linkClassName} href="/#testimonials">
            Testimonials
          </Link>
          <Link className={linkClassName} href="/#faqs">
            FAQs
          </Link>
          <Link className={linkClassName} href="/contact">
            Contact Us
          </Link>
        </FooterColumn>
        <FooterColumn title="Legal">
          <Link className={linkClassName} href="/privacy-policy">
            Privacy Policy
          </Link>
          <Link className={linkClassName} href="/terms-of-service">
            Terms of Service
          </Link>
        </FooterColumn>
      </div>
      <p
        className={`${PAGE_X} py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground`}
      >
        © {new Date().getFullYear()} {theme.siteName}
      </p>
    </footer>
  );
}
