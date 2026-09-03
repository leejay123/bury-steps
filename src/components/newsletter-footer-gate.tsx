import { NewsletterSignup } from "@/components/newsletter-signup";

/**
 * Thin wrapper kept as the footer's naming seam for the newsletter card —
 * shown on every page for every visitor, admins included. NewsletterSignup
 * owns its own full-width background and top/bottom dividers.
 */
export function NewsletterFooterGate() {
  return <NewsletterSignup />;
}
