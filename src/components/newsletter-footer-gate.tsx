import { FullWidthDivider } from "@/components/full-width-divider";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { PAGE_X } from "@/lib/page-x";

/**
 * Wraps the footer's newsletter signup card, shown on every page for every
 * visitor — admins included. Owns its own wrapper and bottom divider so
 * there's never a stray border line left behind.
 */
export function NewsletterFooterGate() {
  return (
    <div className="relative">
      <div className={PAGE_X}>
        <NewsletterSignup />
      </div>
      <FullWidthDivider position="bottom" />
    </div>
  );
}
