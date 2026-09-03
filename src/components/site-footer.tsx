import Link from "next/link";
import { Footprints, Info, Shield } from "lucide-react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { NewsletterFooterGate } from "@/components/newsletter-footer-gate";
import { SiteFooterAccordion } from "@/components/site-footer-accordion";
import { PAGE_X } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";

// Footer-4's per-column banner (Facebook/Youtube/…) with just the brand
// swapped out — same text-sm/font-medium/p-2 row and icon+label layout the
// block's own SocialCard uses (see blocks/footer-4.tsx), just our own
// section icon/name instead of a social network, and no arrow since these
// aren't outbound links to somewhere else. Desktop/tablet only — mobile
// gets the accordion version below instead (SiteFooterAccordion), since
// three fully expanded columns is a lot of scroll on a phone.
function FooterColumn({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={title} className="flex flex-col">
      {/* Border on the full-width wrapper, PAGE_X only on the text inside —
          same edge-to-edge-line/inset-content split as the rest of the
          footer, so this rule spans the whole row instead of just the
          padded content column. */}
      <div className="border-b">
        <p
          className={`flex items-center gap-2 py-3 text-sm font-medium [&>svg]:size-3.5 [&>svg]:shrink-0 ${PAGE_X}`}
        >
          {icon}
          {title}
        </p>
      </div>
      <div className={`flex flex-col gap-4 py-4 ${PAGE_X}`}>{children}</div>
    </nav>
  );
}

export async function SiteFooter() {
  const theme = await getSiteTheme();
  const facebookUrl = theme.facebookGroupUrl.trim();
  // Exactly footer-4's LinksGroup link style (blocks/footer-4.tsx) — plain
  // color change on hover, no background fill (that only belongs to the
  // block's SocialCard banner, not its link list).
  const linkClassName = "text-sm text-muted-foreground hover:text-foreground";

  // Built once and rendered in both the desktop columns and the mobile
  // accordion below, so the two never drift apart.
  const exploreLinks = (
    <>
      <Link className={linkClassName} href="/">
        Home
      </Link>
      <Link className={linkClassName} href="/notices">
        Notices
      </Link>
      <Link className={linkClassName} href="/progress">
        Progress
      </Link>
      {facebookUrl ? (
        <a className={linkClassName} href={facebookUrl} rel="noopener noreferrer" target="_blank">
          Facebook
        </a>
      ) : null}
    </>
  );
  const aboutLinks = (
    <>
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
    </>
  );
  const legalLinks = (
    <>
      <Link className={linkClassName} href="/privacy-policy">
        Privacy Policy
      </Link>
      <Link className={linkClassName} href="/privacy-policy#cookies">
        Cookie Policy
      </Link>
      <Link className={linkClassName} href="/terms-of-service">
        Terms of Service
      </Link>
      <Link className={linkClassName} href="/terms-of-service#safety">
        Walks &amp; Safety
      </Link>
    </>
  );

  return (
    <footer className="relative z-10 shrink-0 bg-background">
      <FullWidthDivider position="top" />
      <NewsletterFooterGate />
      {/* Edge-to-edge like the rest of the page's full-width dividers —
          deliberately not wrapped in PAGE_X; each cell puts PAGE_X back on
          its own content so text still lines up with the header/hero. */}
      <div className="hidden border-y sm:grid sm:grid-cols-3 sm:divide-x">
        <FooterColumn icon={<Footprints aria-hidden />} title="Explore">
          {exploreLinks}
        </FooterColumn>
        <FooterColumn icon={<Info aria-hidden />} title="About">
          {aboutLinks}
        </FooterColumn>
        <FooterColumn icon={<Shield aria-hidden />} title="Legal">
          {legalLinks}
        </FooterColumn>
      </div>
      {/* Each AccordionItem below already carries its own border-b (its
          last item doubles as the bottom rule); this is only the missing
          top edge, matching the border-y the desktop grid has above. */}
      <div className="border-t sm:hidden" />
      <SiteFooterAccordion
        sections={[
          { icon: <Footprints aria-hidden className="size-3.5 shrink-0" />, title: "Explore", links: exploreLinks },
          { icon: <Info aria-hidden className="size-3.5 shrink-0" />, title: "About", links: aboutLinks },
          { icon: <Shield aria-hidden className="size-3.5 shrink-0" />, title: "Legal", links: legalLinks },
        ]}
      />
      <p
        className={`${PAGE_X} py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground`}
      >
        © {new Date().getFullYear()} {theme.siteName}
      </p>
    </footer>
  );
}
