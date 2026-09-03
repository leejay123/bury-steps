import Link from "next/link";
import { Facebook } from "lucide-react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { NewsletterFooterGate } from "@/components/newsletter-footer-gate";
import { SiteLogo } from "@/components/site-logo";
import { getOptionalUser } from "@/lib/auth";
import { PAGE_X } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      {children}
    </nav>
  );
}

export async function SiteFooter() {
  const [theme, user] = await Promise.all([getSiteTheme(), getOptionalUser()]);
  const facebookUrl = theme.facebookGroupUrl.trim();
  const isAdmin = user?.role === "ADMIN";
  const linkClassName = "text-sm text-muted-foreground hover:text-foreground";

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

        <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 sm:gap-x-12">
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
