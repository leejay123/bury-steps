"use client";

import { usePathname } from "next/navigation";
import { NewsletterSignup } from "@/components/newsletter-signup";

/** /privacy redirects to /privacy-policy, so only the real destination needs listing. */
const NEWSLETTER_PATHS = new Set(["/", "/terms-of-service", "/privacy-policy"]);

/**
 * Shows the newsletter card only on the homepage, Terms of Service, and
 * Privacy Policy — everywhere else (Notices, Progress, admin pages, Contact,
 * walk share links, …) it would just be clutter between the page's own
 * content and the footer's links. Applies to every visitor alike, signed in
 * or not.
 */
export function NewsletterFooterGate() {
  const pathname = usePathname();
  if (!NEWSLETTER_PATHS.has(pathname)) return null;
  return <NewsletterSignup />;
}
